import mongoose from "mongoose";

const CashShiftSchema = new mongoose.Schema(
	{
		adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
		branch: { type: String, default: null },
		openedAt: { type: Date, default: Date.now },
		closedAt: { type: Date, default: null },
		status: { type: String, enum: ["open", "closing_requested", "closed"], default: "open" },
		adminReportedCash: { type: Number, default: 0 }, // amount admin reports at checkout
		expectedCash: { type: Number, default: 0 }, // computed from vouchers created in shift
		supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
		supervisorApproved: { type: Boolean, default: false },
		note: { type: String, default: null }
	},
	{ timestamps: true }
);

export default mongoose.models.CashShift || mongoose.model("CashShift", CashShiftSchema);
