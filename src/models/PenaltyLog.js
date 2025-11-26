import mongoose from "mongoose";

const PenaltyLogSchema = new mongoose.Schema(
  {
    userType: { type: String, enum: ["customer", "driver"], required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: "Trip" },

    actionType: {
      type: String,
      enum: ["cancel", "no_show", "ignored_trip", "repeated_misconduct"],
      required: true
    },

    reason: { type: String, default: "" },

    penaltyApplied: {
      type: Boolean,
      default: false
    },

    penalty: {
      level: { type: Number, default: 0 },
      durationMinutes: { type: Number, default: 0 },
      expiresAt: { type: Date, default: null }
    }
  },
  { timestamps: true }
);

export default mongoose.models.PenaltyLog || mongoose.model("PenaltyLog", PenaltyLogSchema);
