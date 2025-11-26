import mongoose from "mongoose";

const GeofenceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },

    polygon: [
      {
        lat: Number,
        lng: Number
      }
    ],

    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.models.Geofence || mongoose.model("Geofence", GeofenceSchema);
