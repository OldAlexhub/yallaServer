import mongoose from "mongoose";

const VoucherSchema = new mongoose.Schema(
	{
		code: {
			type: String,
			required: true,
			unique: true
		},
		driverId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Driver",
			required: true
		},
		shiftId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "CashShift",
			default: null
		},
		adminId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Admin",
			required: true
		},
		amountPaid: {
			type: Number,
			required: true
		},
		redeemed: {
			type: Boolean,
			default: false
		},
		redeemedAt: {
			type: Date,
			default: null
		},
		activeFrom: {
			type: Date,
			default: null
		},
		expiresAt: {
			type: Date,
			required: true
		}
	},
	{ timestamps: true }
);

export default mongoose.models.Voucher || mongoose.model("Voucher", VoucherSchema);
