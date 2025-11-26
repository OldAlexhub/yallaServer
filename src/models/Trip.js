import mongoose from "mongoose";

const TripSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null
    },

    pickup: {
      lat: Number,
      lng: Number,
      address: String
    },

    dropoff: {
      lat: Number,
      lng: Number,
      address: String
    },

    fareEstimate: { type: Number },
    // final fare charged to customer (post-discount / voucher)
    fare: { type: Number, default: null },
    // percentage discount applied on this trip (0-100)
    discountPercent: { type: Number, min: 0, max: 100, default: 0 },
    // absolute discount amount in same currency as fare
    discountAmount: { type: Number, default: 0 },
    distanceKm: { type: Number },
    durationMin: { type: Number },

    status: {
      type: String,
      enum: [
        "requested",
        "scheduled",
        "driver_assigned",
        "driver_en_route",
        "customer_onboard",
        "completed",
        "cancelled"
      ],
      default: "requested"
    },

    scheduledAt: { type: Date, default: null }, // For future scheduled trips
    // assignment state for automatic dispatch attempts
    assignmentAttempts: { type: Number, default: 0 },
    attemptedDriverIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Driver' }],
    offerExpiresAt: { type: Date, default: null },
    broadcasted: { type: Boolean, default: false },

    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },

    cancelReason: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.models.Trip || mongoose.model("Trip", TripSchema);
