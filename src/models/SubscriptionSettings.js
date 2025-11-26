import mongoose from "mongoose";

const SubscriptionSettingsSchema = new mongoose.Schema(
  {
    weeklyFee: { type: Number, required: true, min: 0, default: 50 }, // Amount for 7 days
    discountPercentage: { type: Number, required: true, min: 0, max: 100, default: 0 } // System-wide discount (legacy)
  },
  { timestamps: true }
);

export default mongoose.models.SubscriptionSettings || mongoose.model("SubscriptionSettings", SubscriptionSettingsSchema);