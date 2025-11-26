import mongoose from "mongoose";

const FounderLimitSchema = new mongoose.Schema(
  {
    limit: { type: Number, required: true, min: 1 }
  },
  { timestamps: true }
);

export default mongoose.models.FounderLimit || mongoose.model("FounderLimit", FounderLimitSchema);