import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  uniqueId: { type: String, unique: true, required: true, uppercase: true },
  description: { type: String },
  address: {
    street: String, city: String, state: String, pincode: String,
    country: { type: String, default: 'India' },
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },
  phone: { type: String },
  email: { type: String },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }],
  specializations: [{ type: String }],
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  rating: { type: Number, default: 0 },

  
}, { timestamps: true });

hospitalSchema.index({ location: '2dsphere' });

export default mongoose.model('Hospital', hospitalSchema);
