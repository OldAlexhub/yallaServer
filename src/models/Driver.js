import mongoose from "mongoose";

const DriverSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },

		phone: { type: String, required: true, unique: true },

		passwordHash: { type: String, required: true },

		vehicle: {
			brand: { type: String },
			model: { type: String },
			year: { type: Number },
			plateNumber: { type: String }
		},

		documents: {
			nationalIdFront: { type: String },
			nationalIdBack: { type: String },
			driverLicense: { type: String },
			vehicleLicense: { type: String },
			insurance: { type: String },
			criminalRecord: { type: String },
			inspectionReport: { type: String },
			carPhotos: [{ type: String }],
			profilePhoto: { type: String },
			status: {
				type: String,
				enum: ["missing", "pending", "approved", "rejected"],
				default: "missing"
			}
		},

		subscription: {
			active: { type: Boolean, default: false },
			expiresAt: { type: Date, default: null },
			discount: { type: Number, default: 0 } // Additional discount percentage for this driver
		},

		penalty: {
			active: { type: Boolean, default: false },
			reason: { type: String, default: "" },
			expiresAt: { type: Date, default: null },
			level: { type: Number, default: 0 }
		},

		online: { type: Boolean, default: false },

		currentLocation: {
			lat: { type: Number },
			lng: { type: Number }
		}
	},
	{ timestamps: true }
);

export default mongoose.models.Driver || mongoose.model("Driver", DriverSchema);
