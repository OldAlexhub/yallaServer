import mongoose from "mongoose";

const CategoriesSchema = new mongoose.Schema(
  {
    categories: [{ type: String, required: true }]
  },
  { timestamps: true }
);

export default mongoose.models.Categories || mongoose.model("Categories", CategoriesSchema);