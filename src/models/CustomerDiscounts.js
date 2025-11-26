import mongoose from "mongoose";

const CustomerDiscountsSchema = new mongoose.Schema(
  {
    founderDiscountPercentage: { type: Number, required: true, min: 0, max: 100, default: 20 },
    regularDiscountPercentage: { type: Number, required: true, min: 0, max: 100, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.models.CustomerDiscounts || mongoose.model("CustomerDiscounts", CustomerDiscountsSchema);
