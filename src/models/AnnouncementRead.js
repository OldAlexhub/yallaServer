import mongoose from "mongoose";

const AnnouncementReadSchema = new mongoose.Schema(
  {
    announcementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Announcement",
      required: true
    },
    userType: {
      type: String,
      enum: ["customer", "driver"],
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    readAt: {
      type: Date,
      default: () => new Date()
    }
  },
  { timestamps: true }
);

export default mongoose.models.AnnouncementRead || mongoose.model("AnnouncementRead", AnnouncementReadSchema);
