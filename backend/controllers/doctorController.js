import Doctor from '../models/Doctor.js';
import Queue from '../models/Queue.js';
import Appointment from '../models/Appointment.js';
import { getTodayDate, generateDoctorId } from '../utils/helpers.js';
import User from '../models/User.js';

// GET /api/doctors
export const getDoctors = async (req, res, next) => {
  try {
    const {
      search,
      specialization,
      city,
      lat,
      lng,
      radius = 15,
      page = 1,
      limit = 12
    } = req.query;

    const query = { isActive: true };

    const skip = (Number(page) - 1) * Number(limit);

    // SEARCH FILTER
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { uniqueId: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } },
        { clinicName: { $regex: search, $options: 'i' } },
      ];
    }

    //  SPECIALIZATION FILTER
    if (specialization && specialization !== 'All') {
      query.specialization = { $regex: specialization, $options: 'i' };
    }

    //  CITY FILTER
    if (city) {
      query['clinicAddress.city'] = { $regex: city, $options: 'i' };
    }

    let doctors;

    //  GEO SEARCH (SAFE VERSION)
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      doctors = await Doctor.find({
        ...query,
        location: {
          $exists: true,
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [Number(lng), Number(lat)],
            },
            $maxDistance: Number(radius || 15) * 1000,
          },
        },
      })
        .limit(Number(limit))
        .select('-userId');
    } else {
      //  NORMAL LISTING (FALLBACK)
      doctors = await Doctor.find(query)
        .skip(skip)
        .limit(Number(limit))
        .sort({ rating: -1, totalPatientsSeen: -1 })
        .select('-userId');
    }

    const total = await Doctor.countDocuments(query);

    return res.json({
      success: true,
      data: doctors,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });

  } catch (err) {
    console.error('getDoctors ERROR:', err); //  important debug
    next(err);
  }
};
// GET /api/doctors/me
export const getMyDoctorProfile = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    const today = getTodayDate();
    const queue = await Queue.findOne({ doctorId: doctor._id, date: today });
    const appointments = await Appointment.find({ doctorId: doctor._id, date: today })
      .sort({ isPriority: -1, tokenNumber: 1 });
    res.json({ success: true, data: { doctor, queue, appointments } });
  } catch (err) { next(err); }
};

// GET /api/doctors/:id
export const getDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({
      $or: [{ _id: req.params.id.length === 24 ? req.params.id : null }, { uniqueId: req.params.id.toUpperCase() }],
    }).populate('hospitalId', 'name uniqueId address');
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    const today = getTodayDate();
    const queue = await Queue.findOne({ doctorId: doctor._id, date: today });
    const todayBookings = await Appointment.countDocuments({ doctorId: doctor._id, date: today, status: { $nin: ['cancelled', 'missed'] } });

    // Compute live queue stats using real appointment counts (not token arithmetic)
    const waitingCount = await Appointment.countDocuments({
      doctorId: doctor._id,
      date: today,
      status: { $in: ['waiting', 'be_ready'] },
    });
    const estimatedWait = waitingCount * (doctor.avgTimePerPatient || 15);

    res.json({ success: true, data: { ...doctor.toObject(), queue: queue || null, todayBookings, waitingCount, estimatedWait } });
  } catch (err) { next(err); }
};

// PUT /api/doctors/profile
export const updateDoctorProfile = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found' });

    const allowed = ['name', 'specialization', 'qualifications', 'experience', 'bio', 'clinicName',
      'clinicAddress', 'consultationFee', 'avgTimePerPatient', 'maxPatientsPerDay', 'workingDays', 'workingHours', 'location'];
    allowed.forEach(f => { if (req.body[f] !== undefined) doctor[f] = req.body[f]; });
    await doctor.save();
    res.json({ success: true, message: 'Profile updated', data: doctor });
  } catch (err) { next(err); }
};

// PATCH /api/doctors/booking-toggle
export const toggleBooking = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    doctor.isBookingOpen = req.body.isBookingOpen !== undefined ? req.body.isBookingOpen : !doctor.isBookingOpen;
    await doctor.save();
    req.io.to(`doctor_${doctor._id}`).emit('booking_status_changed', { isBookingOpen: doctor.isBookingOpen });
    res.json({ success: true, message: `Booking ${doctor.isBookingOpen ? 'enabled' : 'disabled'}`, data: { isBookingOpen: doctor.isBookingOpen } });
  } catch (err) { next(err); }
};

// POST /api/doctors/register-clinic
export const registerClinic = async (req, res, next) => {
  try {
    const { name, phone, password, specialization, clinicName, clinicAddress, avgTimePerPatient, maxPatientsPerDay, consultationFee, experience, qualifications } = req.body;
    if (!name || !phone || !password || !specialization) {
      return res.status(400).json({ success: false, message: 'Name, phone, password and specialization are required' });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser && existingUser.role === 'doctor') {
      return res.status(400).json({ success: false, message: 'A doctor with this phone is already registered' });
    }

    let user = existingUser;
    if (!user) {
      user = await User.create({ name, phone, password, role: 'doctor' });
    } else {
      user.role = 'doctor';
      await user.save();
    }

    const uniqueId = await generateDoctorId(name);
    const doctor = await Doctor.create({
      userId: user._id, uniqueId, name, phone,
      specialization, clinicName: clinicName || `${name}'s Clinic`,
      clinicAddress: clinicAddress || {},
      avgTimePerPatient: avgTimePerPatient || 15,
      maxPatientsPerDay: maxPatientsPerDay || 30,
      consultationFee: consultationFee || 0,
      experience: experience || 0,
      qualifications: qualifications || [],
    });

    res.status(201).json({ success: true, message: `Doctor registered! Your unique ID is ${uniqueId}`, data: { doctor, uniqueId } });
  } catch (err) { next(err); }
};
