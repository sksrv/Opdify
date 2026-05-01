import express from 'express';
import { upload } from '../config/cloudinary.js';
import { uploadAvatar } from '../controllers/uploadController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);
export default router;
