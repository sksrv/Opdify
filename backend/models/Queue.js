import mongoose from 'mongoose';

const queueSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: String, required: true },
  currentToken: { type: Number, default: 0 },
  lastTokenIssued: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['not_started', 'active', 'paused', 'ended'],
    default: 'not_started',
  },
  startedAt: { type: Date },
  pausedAt: { type: Date },
  endedAt: { type: Date },
  totalPatients: { type: Number, default: 0 },
  completedPatients: { type: Number, default: 0 },
  skippedPatients: { type: Number, default: 0 },
}, { timestamps: true });

queueSchema.index({ doctorId: 1, date: 1 }, { unique: true });

export default mongoose.model('Queue', queueSchema);
