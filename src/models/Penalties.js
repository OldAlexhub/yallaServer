import mongoose from "mongoose";

const PenaltiesSchema = new mongoose.Schema(
  {
    maxIgnoredTrips: { type: Number, required: true, min: 0 },
    maxConsecutiveIgnores: { type: Number, required: true, min: 0 },
    penaltyDuration: { type: Number, required: true, min: 0 },
    noShowBanThreshold: { type: Number, required: true, min: 0 },
    cancellationThreshold: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

export default mongoose.models.Penalties || mongoose.model("Penalties", PenaltiesSchema);