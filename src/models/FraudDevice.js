import mongoose from "mongoose";

const FraudDeviceSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, index: true },
    ip: { type: String, default: null },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null
    },

    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null
    },

    flagged: { type: Boolean, default: false },
    reason: { type: String, default: "" },

    deviceBan: { type: Boolean, default: false },
    bannedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export default mongoose.model("FraudDevice", FraudDeviceSchema);
