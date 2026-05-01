import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
const router = express.Router();

router.put('/profile', protect, async (req, res, next) => {
  try {
    const { name, email, avatar } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, email, avatar }, { new: true, runValidators: true });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

export default router;
