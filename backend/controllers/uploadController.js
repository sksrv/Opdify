import Doctor from '../models/Doctor.js';
import User from '../models/User.js';

// POST /api/upload/avatar   (multipart/form-data, field: avatar)
export const uploadAvatar = async (req, res, next) => {
  try {
    console.log('Upload request received');
    console.log('req.file:', req.file);
    console.log('req.user:', req.user);

    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const avatarUrl = req.file.path; // Cloudinary secure URL

    console.log('Avatar URL:', avatarUrl);

    // Update user avatar
    await User.findByIdAndUpdate(req.user._id, { avatar: avatarUrl });

    // If doctor, also update doctor avatar
    if (req.user.role === 'doctor') {
      await Doctor.findOneAndUpdate({ userId: req.user._id }, { avatar: avatarUrl });
    }

    res.json({ success: true, message: 'Avatar uploaded', data: { avatarUrl } });
  } catch (err) {
    console.error('Upload error:', err);
    next(err);
  }
};
