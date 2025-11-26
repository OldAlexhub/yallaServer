import mongoose from "mongoose";

const DriverSubscriptionSettingsSchema = new mongoose.Schema(
  {
    fee: { type: Number, required: true, min: 0 },
    durationDays: { type: Number, required: true, min: 1, default: 7 },
    discountPercentage: { type: Number, required: true, min: 0, max: 100, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.models.DriverSubscriptionSettings || mongoose.model("DriverSubscriptionSettings", DriverSubscriptionSettingsSchema);