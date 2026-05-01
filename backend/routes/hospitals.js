// routes/hospitals.js
import express from 'express';
import { getHospitals, getHospital, createHospital } from '../controllers/hospitalController.js';
import { protect, authorize } from '../middleware/auth.js';
const router = express.Router();
router.get('/', getHospitals);
router.get('/:id', getHospital);
router.post('/', protect, authorize('admin'), createHospital);
export default router;
