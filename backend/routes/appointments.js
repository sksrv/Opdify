// routes/appointments.js
import express from 'express';
import { bookAppointment, getMyAppointments, getAppointmentStatus, cancelAppointment } from '../controllers/appointmentController.js';
import { protect } from '../middleware/auth.js';
const router = express.Router();
router.post('/book', protect, bookAppointment);
router.get('/my', protect, getMyAppointments);
router.get('/:id/status', getAppointmentStatus);
router.patch('/:id/cancel', protect, cancelAppointment);
export default router;
