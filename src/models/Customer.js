import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },

		phone: { type: String, required: true, unique: true },

		passwordHash: { type: String, required: true },



		// legacy simple flag, kept for backward compatibility
		founder: { type: Boolean, default: false },

		banned: { type: Boolean, default: false },
		banReason: { type: String, default: null },

		penalties: {
			cancelCount7Days: { type: Number, default: 0 },
			noShowCount7Days: { type: Number, default: 0 },
			blockedUntil: { type: Date, default: null }
		},

		loyalty: {
			tier: {
				type: String,
				enum: ["founder", "regular", "banned"],
				default: "regular"
			},
			referralCode: {
				type: String,
				unique: true,
				sparse: true
			},
			referredBy: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "Customer",
				default: null
			},
			referralCount: {
				type: Number,
				default: 0
			}
		}
	},
	{ timestamps: true }
);

export default mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);
