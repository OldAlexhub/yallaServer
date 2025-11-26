import mongoose from "mongoose";

const AnnouncementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },

    target: {
      type: String,
      enum: [
        "all_customers",
        "all_drivers",
        "active_drivers",
        "specific_customer",
        "specific_driver"
      ],
      required: true
    },

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

    type: {
      type: String,
      enum: ["banner", "popup", "urgent"],
      default: "banner"
    },

    expiresAt: { type: Date, default: null },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.models.Announcement || mongoose.model("Announcement", AnnouncementSchema);
