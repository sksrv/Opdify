import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import { generateDoctorId } from '../utils/helpers.js';

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });

const respond = (res, statusCode, user, message = 'Success') => {
  const token = signToken(user._id);
  const userData = { ...user.toObject() };
  delete userData.password;
  res.status(statusCode).json({ success: true, message, token, user: userData });
};

// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, phone, password, role, specialization, clinicName } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Name, phone and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ phone });
    if (existing) return res.status(400).json({ success: false, message: 'Phone number already registered' });

    const user = await User.create({ name, phone, password, role: role || 'patient' });

    if (role === 'doctor') {
      const uniqueId = await generateDoctorId(name);
      await Doctor.create({
        userId: user._id,
        uniqueId,
        name,
        phone,
        specialization: specialization || 'General Physician',
        clinicName: clinicName || '',
        avgTimePerPatient: req.body.avgTimePerPatient || 15,
        maxPatientsPerDay: req.body.maxPatientsPerDay || 30,
      });
    }

    respond(res, 201, user, 'Registration successful');
  } catch (err) { next(err); }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'Phone and password are required' });
    }

    const user = await User.findOne({ phone }).select('+password');
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    respond(res, 200, user, 'Login successful');
  } catch (err) { next(err); }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  const user = req.user;
  let doctorProfile = null;
  if (user.role === 'doctor') {
    doctorProfile = await Doctor.findOne({ userId: user._id });
  }
  res.json({ success: true, user, doctorProfile });
};
