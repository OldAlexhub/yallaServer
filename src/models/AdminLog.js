import mongoose from 'mongoose';

const AdminLogSchema = new mongoose.Schema({
  admin: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    name: String,
    email: String,
  },
  event: { type: String },
  severity: { type: String, enum: ['low','medium','high','critical'], default: 'low' },
  description: String,
  timestamp: { type: Date, default: Date.now },
  ip: String,
  changes: [
    {
      field: String,
      old: mongoose.Schema.Types.Mixed,
      new: mongoose.Schema.Types.Mixed,
    }
  ],
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

export default mongoose.models.AdminLog || mongoose.model('AdminLog', AdminLogSchema);