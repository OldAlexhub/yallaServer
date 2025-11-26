import mongoose from "mongoose";

const HeatZoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    // polygon for the zone
    polygon: [
      {
        lat: Number,
        lng: Number
      }
    ],

    // demand level for visual cue only, no surge pricing
    level: {
      type: String,
      enum: ["cool", "warm", "hot", "red"],
      default: "cool"
    },

    // optional descriptive label (e.g. "High airport demand")
    label: { type: String, default: "" },

    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.models.HeatZone || mongoose.model("HeatZone", HeatZoneSchema);
