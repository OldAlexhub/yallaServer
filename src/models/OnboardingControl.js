import mongoose from "mongoose";

const OnboardingControlSchema = new mongoose.Schema(
  {
    minTripsThreshold: { type: Number, required: true, default: 3 },
    overrideMode: { type: Boolean, required: true, default: false },
    lockOnboarding: { type: Boolean, required: true, default: false },
    lastCalculatedAvg: { type: Number, required: true, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.models.OnboardingControl || mongoose.model("OnboardingControl", OnboardingControlSchema);
