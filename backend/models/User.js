import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    unique: true,
    trim: true,
    match: [/^[6-9]\d{9}$/, 'Provide a valid 10-digit Indian phone number'],
  },
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  password: { type: String, minlength: 6, select: false },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);
