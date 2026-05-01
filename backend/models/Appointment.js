import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patientName: { type: String, required: true },
  patientPhone: { type: String, required: true },
  tokenNumber: { type: Number, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  status: {
    type: String,
    enum: ['waiting', 'be_ready', 'in_progress', 'completed', 'skipped', 'missed', 'cancelled'],
    default: 'waiting',
  },
  isPriority: { type: Boolean, default: false },
  notes: { type: String },
  estimatedTime: { type: Number },
  completedAt: { type: Date },
  skippedAt: { type: Date },
  recallCount: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
}, { timestamps: true });

appointmentSchema.index({ doctorId: 1, date: 1, status: 1 });
appointmentSchema.index({ patientId: 1, date: 1 });
appointmentSchema.index({ doctorId: 1, date: 1, tokenNumber: 1 }, { unique: true });

export default mongoose.model('Appointment', appointmentSchema);
