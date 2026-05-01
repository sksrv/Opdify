import Queue from '../models/Queue.js';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import { getTodayDate } from '../utils/helpers.js';

/* ─────────────────────────────────────────────
   STATE MACHINE (PRODUCTION SAFE)
───────────────────────────────────────────── */
const VALID_TRANSITIONS = {
  waiting: ['be_ready', 'skipped'],
  be_ready: ['in_progress', 'skipped'],
  in_progress: ['completed', 'skipped'],
  skipped: ['waiting'],
};

const canTransition = (from, to) => {
  return VALID_TRANSITIONS[from]?.includes(to);
};

/* ─────────────────────────────────────────────
   SOCKET BROADCAST
───────────────────────────────────────────── */
const broadcast = (io, doctorId, event, data) => {
  io.to(`doctor_${doctorId}`).emit(event, data);
  io.to(`queue_${doctorId}`).emit(event, data);
};

/* ─────────────────────────────────────────────
   ADVANCE QUEUE (CORE ENGINE)
───────────────────────────────────────────── */
const advanceQueue = async (queue, doctorId, today, io) => {
  // Search ALL waiting/be_ready patients (not just ahead of currentToken),
  // so recalled patients with lower token numbers are also picked up.
  const next = await Appointment.findOne({
    doctorId,
    date: today,
    status: { $in: ['waiting', 'be_ready'] },
  }).sort({ isPriority: -1, tokenNumber: 1 });

  if (!next) {
    await queue.save();
    broadcast(io, doctorId.toString(), 'queue_updated', { queue, done: true });
    return queue;
  }

  queue.currentToken = next.tokenNumber;
  await queue.save();

  next.status = 'in_progress';
  await next.save();

  // Mark the next patient in line as be_ready so they can prepare
  const nextWaiting = await Appointment.findOne({
    doctorId,
    date: today,
    tokenNumber: { $gt: next.tokenNumber },
    status: 'waiting',
  }).sort({ tokenNumber: 1 });

  if (nextWaiting) {
    nextWaiting.status = 'be_ready';
    await nextWaiting.save();
  }

  if (next.patientId) {
    io.to(`patient_${next.patientId}`).emit('your_turn', {
      tokenNumber: next.tokenNumber,
    });
  }

  return queue;
};

/* ─────────────────────────────────────────────
   START CLINIC
───────────────────────────────────────────── */
export const startQueue = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    const today = getTodayDate();

    let queue = await Queue.findOne({ doctorId: doctor._id, date: today });
    if (!queue) queue = new Queue({ doctorId: doctor._id, date: today });

    queue.status = 'active';
    queue.startedAt = new Date();
    queue.currentToken = 0;

    //  Assign first patient
    const firstPatient = await Appointment.findOne({
      doctorId: doctor._id,
      date: today,
    }).sort({ isPriority: -1, tokenNumber: 1 });

    if (firstPatient) {
      queue.currentToken = firstPatient.tokenNumber;

  //    if (canTransition(firstPatient.status, 'in_progress')) {
        firstPatient.status = 'in_progress';
        await firstPatient.save();
    //  }

      const nextWaiting = await Appointment.findOne({
        doctorId: doctor._id,
        date: today,
        tokenNumber: { $gt: firstPatient.tokenNumber },
        status: 'waiting',
      }).sort({ tokenNumber: 1 });

      if (nextWaiting && canTransition(nextWaiting.status, 'be_ready')) {
        nextWaiting.status = 'be_ready';
        await nextWaiting.save();
      }
    }

    await queue.save();

    doctor.isAvailableToday = true;
    doctor.isBookingOpen = true;
    await doctor.save();

    const appointments = await Appointment.find({
      doctorId: doctor._id,
      date: today,
    }).sort({ isPriority: -1, tokenNumber: 1 });

    broadcast(req.io, doctor._id.toString(), 'queue_updated', {
      queue,
      appointments,
    });

    res.json({ success: true, data: { queue, appointments } });
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────
   NEXT PATIENT
───────────────────────────────────────────── */
export const nextPatient = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    const today = getTodayDate();
    const queue = await Queue.findOne({ doctorId: doctor._id, date: today });

    if (!queue || queue.status !== 'active') {
      return res.status(400).json({ message: 'Queue not active' });
    }

    if (queue.currentToken > 0) {
      const current = await Appointment.findOne({
        doctorId: doctor._id,
        date: today,
        tokenNumber: queue.currentToken,
      });

      // Force-complete the current patient regardless of state machine edge cases.
      // A patient can be in_progress, be_ready, or even waiting if they were
      // skipped/recalled. In all active states, marking them completed is correct.
      if (current && ['in_progress', 'be_ready', 'waiting'].includes(current.status)) {
        current.status = 'completed';
        current.completedAt = new Date();
        await current.save();
      }
    }

    await advanceQueue(queue, doctor._id, today, req.io);

    const appointments = await Appointment.find({
      doctorId: doctor._id,
      date: today,
    }).sort({ isPriority: -1, tokenNumber: 1 });

    broadcast(req.io, doctor._id.toString(), 'queue_updated', {
      queue,
      appointments,
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────
   SKIP
───────────────────────────────────────────── */
export const skipPatient = async (req, res, next) => {
  try {
    const { tokenNumber } = req.body;

    const doctor = await Doctor.findOne({ userId: req.user._id });
    const today = getTodayDate();
    const queue = await Queue.findOne({ doctorId: doctor._id, date: today });

    const apt = await Appointment.findOne({
      doctorId: doctor._id,
      date: today,
      tokenNumber,
    });

    if (!apt || !canTransition(apt.status, 'skipped')) {
      return res.status(400).json({ message: 'Invalid skip' });
    }

    apt.status = 'skipped';
    await apt.save();

    if (tokenNumber === queue.currentToken) {
      await advanceQueue(queue, doctor._id, today, req.io);
    } else {
      await queue.save();
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────
   RECALL
───────────────────────────────────────────── */
export const recallPatient = async (req, res, next) => {
  try {
    const { appointmentId } = req.body;

    const apt = await Appointment.findById(appointmentId);

    if (!apt || !canTransition(apt.status, 'waiting')) {
      return res.status(400).json({ message: 'Invalid recall' });
    }

    apt.status = 'waiting';
    apt.recallCount += 1;
    await apt.save();

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────
   PAUSE / RESUME
───────────────────────────────────────────── */
export const togglePause = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    const today = getTodayDate();

    const queue = await Queue.findOne({ doctorId: doctor._id, date: today });

    if (queue.status === 'active') queue.status = 'paused';
    else if (queue.status === 'paused') queue.status = 'active';

    await queue.save();

    broadcast(req.io, doctor._id.toString(), 'queue_updated', { queue });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────
   ADD WALK-IN (PRIORITY)
───────────────────────────────────────────── */
export const addPriorityPatient = async (req, res, next) => {
  try {
    const { patientName, patientPhone } = req.body;

    const doctor = await Doctor.findOne({ userId: req.user._id });
    const today = getTodayDate();

    let queue = await Queue.findOne({ doctorId: doctor._id, date: today });
    if (!queue) queue = new Queue({ doctorId: doctor._id, date: today });

    const tokenNumber = queue.lastTokenIssued + 1;
    queue.lastTokenIssued = tokenNumber;

    await queue.save();

    const apt = await Appointment.create({
      doctorId: doctor._id,
      patientName,
      patientPhone,
      tokenNumber,
      date: today,
      status: 'be_ready',
      isPriority: true,
    });

    broadcast(req.io, doctor._id.toString(), 'queue_updated', { apt });

    res.json({ success: true, data: apt });
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────
   END CLINIC
───────────────────────────────────────────── */
export const endQueue = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    const today = getTodayDate();

    const queue = await Queue.findOne({ doctorId: doctor._id, date: today });

    queue.status = 'ended';
    await queue.save();

    await Appointment.updateMany(
      {
        doctorId: doctor._id,
        date: today,
        status: { $in: ['waiting', 'be_ready', 'in_progress'] },
      },
      { status: 'missed' }
    );

    broadcast(req.io, doctor._id.toString(), 'queue_updated', { queue });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────
   PUBLIC QUEUE
───────────────────────────────────────────── */
export const getQueuePublic = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const today = getTodayDate();

    const queue = await Queue.findOne({ doctorId, date: today });

    const appointments = await Appointment.find({
      doctorId,
      date: today,
    });

    // 🔥 CALCULATE REAL DATA
    const total = appointments.length;

    const waiting = appointments.filter(a =>
      ['waiting', 'be_ready'].includes(a.status)
    ).length;

    const inProgress = appointments.filter(a =>
      a.status === 'in_progress'
    ).length;

    const completed = appointments.filter(a =>
      a.status === 'completed'
    ).length;

    res.json({
      success: true,
      data: {
        queue,
        stats: {
          total,
          waiting,
          inProgress,
          completed,
        }
      }
    });

  } catch (err) {
    next(err);
  }
};