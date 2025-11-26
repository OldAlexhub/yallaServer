import mongoose from "mongoose";

const SystemConfigSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

export default mongoose.models.SystemConfig || mongoose.model("SystemConfig", SystemConfigSchema);
