import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'EGP' },
    gateway: { type: String, enum: ['offline','paymob','other'], default: 'offline' },
    gatewayPaymentId: { type: String, default: null },
    status: { type: String, enum: ['pending','succeeded','failed'], default: 'succeeded' },
    shiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'CashShift', default: null },
    voucherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    metadata: { type: Object, default: {} },
    // settlement/reconciliation fields
    settlementId: { type: String, default: null },
    payoutDate: { type: Date, default: null },
    fees: { type: Number, default: 0 },
    reconciled: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
