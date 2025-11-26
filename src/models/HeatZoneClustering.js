import mongoose from "mongoose";

const HeatZoneClusteringSchema = new mongoose.Schema(
  {
    minPoints: { type: Number, required: true, min: 0 },
    maxDistance: { type: Number, required: true, min: 0 },
    timeWindow: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

export default mongoose.models.HeatZoneClustering || mongoose.model("HeatZoneClustering", HeatZoneClusteringSchema);