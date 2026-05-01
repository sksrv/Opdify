// routes/doctors.js
import express from 'express';
import { getDoctors, getDoctor, getMyDoctorProfile, updateDoctorProfile, toggleBooking, registerClinic } from '../controllers/doctorController.js';
import { protect, authorize } from '../middleware/auth.js';
const router = express.Router();
router.get('/', getDoctors);
router.get('/me', protect, authorize('doctor'), getMyDoctorProfile);
router.get('/:id', getDoctor);
router.put('/profile', protect, authorize('doctor'), updateDoctorProfile);
router.patch('/booking-toggle', protect, authorize('doctor'), toggleBooking);
router.post('/register-clinic', registerClinic);
export default router;
