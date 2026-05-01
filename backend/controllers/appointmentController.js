import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import Queue from '../models/Queue.js';
import { getTodayDate } from '../utils/helpers.js';

// POST /api/appointments/book
export const bookAppointment = async (req, res, next) => {
  try {
    const { doctorId, patientName, patientPhone, notes } = req.body;
    if (!doctorId || !patientName || !patientPhone) {
      return res.status(400).json({ success: false, message: 'doctorId, patientName, patientPhone are required' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    if (!doctor.isBookingOpen) return res.status(400).json({ success: false, message: 'Booking is currently closed' });

    const today = getTodayDate();
    const todayCount = await Appointment.countDocuments({ doctorId, date: today, status: { $nin: ['cancelled', 'missed'] } });
    if (todayCount >= doctor.maxPatientsPerDay) {
      return res.status(400).json({ success: false, message: 'Doctor is fully booked for today' });
    }

    const dup = await Appointment.findOne({ doctorId, date: today, patientPhone, status: { $nin: ['cancelled', 'missed', 'completed'] } });
    if (dup) return res.status(400).json({ success: false, message: 'You already have an active booking today', data: dup });

    let queue = await Queue.findOne({ doctorId, date: today });
    if (!queue) queue = await Queue.create({ doctorId, date: today, lastTokenIssued: 0 });

    const tokenNumber = queue.lastTokenIssued + 1;
    queue.lastTokenIssued = tokenNumber;
    queue.totalPatients = tokenNumber;
    await queue.save();

    const patientsAhead = Math.max(0, tokenNumber - queue.currentToken - 1);
    const estimatedTime = patientsAhead * doctor.avgTimePerPatient;

    const appointment = await Appointment.create({
      patientId: req.user._id, doctorId, patientName, patientPhone,
      tokenNumber, date: today, notes, estimatedTime,
    });

    req.io.to(`doctor_${doctorId}`).emit('new_appointment', { appointment, totalWaiting: todayCount + 1 });

    res.status(201).json({
      success: true,
      message: 'Appointment booked!',
      data: {
        appointment,
        queueInfo: { tokenNumber, currentToken: queue.currentToken, patientsAhead, estimatedWaitMinutes: estimatedTime, queueStatus: queue.status },
      },
    });
  } catch (err) { next(err); }
};

// GET /api/appointments/my
export const getMyAppointments = async (req, res, next) => {
  try {
    const { status, limit = 20 } = req.query;
    const query = { patientId: req.user._id };
    if (status) query.status = status;
    const appointments = await Appointment.find(query)
      .populate('doctorId', 'name uniqueId specialization clinicName avatar avgTimePerPatient consultationFee')
      .sort({ createdAt: -1 }).limit(Number(limit));
    res.json({ success: true, data: appointments });
  } catch (err) { next(err); }
};

// GET /api/appointments/:id/status
export const getAppointmentStatus = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('doctorId', 'name uniqueId specialization clinicName avgTimePerPatient isAvailableToday');
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });

    const queue = await Queue.findOne({ doctorId: appointment.doctorId._id, date: appointment.date });
    const patientsAhead = Math.max(0, appointment.tokenNumber - (queue?.currentToken || 0) - 1);
    const estimatedWait = patientsAhead * (appointment.doctorId.avgTimePerPatient || 15);

    let displayStatus = appointment.status;
    if ((queue?.currentToken || 0) + 1 === appointment.tokenNumber && appointment.status === 'waiting') displayStatus = 'be_ready';

    res.json({
      success: true,
      data: { appointment, queue: queue || null, liveInfo: { currentToken: queue?.currentToken || 0, patientsAhead, estimatedWaitMinutes: estimatedWait, displayStatus, queueStatus: queue?.status || 'not_started' } },
    });
  } catch (err) { next(err); }
};

// PATCH /api/appointments/:id/cancel
export const cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, patientId: req.user._id });
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    if (['completed', 'in_progress'].includes(appointment.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel a completed or in-progress appointment' });
    }
    appointment.status = 'cancelled';
    await appointment.save();
    req.io.to(`doctor_${appointment.doctorId}`).emit('appointment_cancelled', { appointmentId: appointment._id });
    res.json({ success: true, message: 'Appointment cancelled' });
  } catch (err) { next(err); }
};
