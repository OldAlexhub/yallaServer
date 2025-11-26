import mongoose from 'mongoose';

const AssignmentLogSchema = new mongoose.Schema(
  {
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null, index: true },
    action: { type: String, enum: ['offer', 'reoffer', 'rejected', 'accepted', 'broadcast'], required: true },
    attemptNumber: { type: Number, default: 0 },
    socketId: { type: String },
    distanceKm: { type: Number, default: null },
    notes: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

AssignmentLogSchema.index({ tripId: 1, timestamp: -1 });

export default mongoose.models.AssignmentLog || mongoose.model('AssignmentLog', AssignmentLogSchema);
