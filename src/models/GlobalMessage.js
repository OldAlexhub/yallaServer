import mongoose from "mongoose";

const GlobalMessageSchema = new mongoose.Schema(
  {
    title: { type: String },
    body: { type: String, required: true },
    visible: { type: Boolean, required: true, default: false }
  },
  { timestamps: true }
);

export default mongoose.models.GlobalMessage || mongoose.model("GlobalMessage", GlobalMessageSchema);