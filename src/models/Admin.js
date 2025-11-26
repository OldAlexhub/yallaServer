import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		email: { type: String, required: true, unique: true },
		passwordHash: { type: String, required: true },
		role: {
			type: String,
			enum: ["superadmin", "dispatcher", "support", "finance"],
			default: "support",
		},
	},
	{ timestamps: true }
);

export default mongoose.models.Admin || mongoose.model("Admin", AdminSchema);
