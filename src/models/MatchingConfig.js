import mongoose from "mongoose";

const MatchingConfigSchema = new mongoose.Schema(
  {
    assignmentRadius: { type: Number, required: true, min: 0 },
    maxRetries: { type: Number, required: true, min: 0 },
    etaMultiplier: { type: Number, required: true, min: 0 },
    cooldownTime: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

export default mongoose.models.MatchingConfig || mongoose.model("MatchingConfig", MatchingConfigSchema);