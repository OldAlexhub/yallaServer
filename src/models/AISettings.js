import mongoose from "mongoose";

const AISettingsSchema = new mongoose.Schema(
  {
    enableHeatZones: { type: Boolean, required: true, default: true },
    predictionInterval: { type: Number, required: true, min: 0 },
    sensitivity: { type: Number, required: true, min: 0, max: 1 },
    minClusterSize: { type: Number, required: true, min: 0 },
    maxClusterSize: { type: Number, required: true, min: 0 },
    minDriversPerZone: { type: Number, required: true, min: 0, default: 1 }
  },
  { timestamps: true }
);

export default mongoose.models.AISettings || mongoose.model("AISettings", AISettingsSchema);