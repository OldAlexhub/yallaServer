import mongoose from 'mongoose';

const DriverOtpSchema = new mongoose.Schema({
  phone: { type: String, required: true, index: true },
  code: { type: String, required: true },
  purpose: { type: String, enum: ['verify','reset'], default: 'verify' },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

export default mongoose.models.DriverOtp || mongoose.model('DriverOtp', DriverOtpSchema);
