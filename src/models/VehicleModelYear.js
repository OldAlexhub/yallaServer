import mongoose from "mongoose";

const VehicleModelYearSchema = new mongoose.Schema(
  {
    year: { type: Number, required: true, min: 1900, max: new Date().getFullYear() }
  },
  { timestamps: true }
);

export default mongoose.models.VehicleModelYear || mongoose.model("VehicleModelYear", VehicleModelYearSchema);