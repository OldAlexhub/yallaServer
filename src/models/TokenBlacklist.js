import mongoose from "mongoose";

const TokenBlacklistSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

TokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.TokenBlacklist || mongoose.model("TokenBlacklist", TokenBlacklistSchema);
