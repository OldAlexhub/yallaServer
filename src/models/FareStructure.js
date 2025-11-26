import mongoose from "mongoose";

const FareStructureSchema = new mongoose.Schema(
  {
    baseFare: { type: Number, required: true, min: 0 },
    perKm: { type: Number, required: true, min: 0 },
    minimumFare: { type: Number, required: true, min: 0 },
    waitingFare: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

export default mongoose.models.FareStructure || mongoose.model("FareStructure", FareStructureSchema);