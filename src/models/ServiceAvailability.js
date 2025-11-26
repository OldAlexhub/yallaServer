import mongoose from "mongoose";

const ServiceAvailabilitySchema = new mongoose.Schema(
  {
    suspendService: { type: Boolean, required: true, default: false },
    disableDriverSignups: { type: Boolean, required: true, default: false },
    disableCustomerSignups: { type: Boolean, required: true, default: false },
    disableTripRequests: { type: Boolean, required: true, default: false }
  },
  { timestamps: true }
);

export default mongoose.models.ServiceAvailability || mongoose.model("ServiceAvailability", ServiceAvailabilitySchema);