import mongoose from "mongoose";

const TripEventLogSchema = new mongoose.Schema(
  {
    event: { type: String, required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
    pickup: {
      lat: Number,
      lng: Number
    },
    dropoff: {
      lat: Number,
      lng: Number
    },
    zoneId: { type: String, index: true },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

TripEventLogSchema.index({ zoneId: 1, timestamp: -1 });

export default mongoose.model("TripEventLog", TripEventLogSchema);
