import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  uniqueId: { type: String, unique: true, required: true, uppercase: true, index: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  email: { type: String },
  specialization: { type: String, required: true, trim: true },
  qualifications: [{ type: String }],
  experience: { type: Number, default: 0 },
  bio: { type: String, maxlength: 500 },
  avatar: { type: String, default: '' },

  clinicName: { type: String, trim: true },
  clinicAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' },
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', default: null },

  avgTimePerPatient: { type: Number, default: 15 },
  maxPatientsPerDay: { type: Number, default: 30 },
  isBookingOpen: { type: Boolean, default: false },
  isAvailableToday: { type: Boolean, default: false },

  workingDays: {
    type: [String],
    default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  },
  workingHours: {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '18:00' },
  },
  consultationFee: { type: Number, default: 0 },

  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  totalPatientsSeen: { type: Number, default: 0 },

  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },


}, { timestamps: true });

doctorSchema.index({ location: '2dsphere' });
doctorSchema.index({ name: 'text', specialization: 'text', clinicName: 'text' });

export default mongoose.model('Doctor', doctorSchema);
