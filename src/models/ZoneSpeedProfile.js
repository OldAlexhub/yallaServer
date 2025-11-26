import mongoose from "mongoose";

const ZoneSpeedProfileSchema = new mongoose.Schema(
  {
    zoneId: { type: String, index: true },
    avgSpeedKph: { type: Number, default: 25 },
    morningSpeed: { type: Number, default: 22 },
    afternoonSpeed: { type: Number, default: 24 },
    eveningSpeed: { type: Number, default: 20 },
    nightSpeed: { type: Number, default: 28 },
    lastUpdated: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model("ZoneSpeedProfile", ZoneSpeedProfileSchema);
