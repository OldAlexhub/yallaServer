import "../src/bootstrap/loadEnv.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Admin from "../src/models/Admin.js";
import { normalizeEmail } from "../src/utils/emailHelpers.js";

const args = process.argv.slice(2);
const [nameArg, emailArg, passwordArg, roleArg] = args;

if (!emailArg || !passwordArg) {
  console.error("Usage: node scripts/createAdmin.js <name?> <email> <password> [role]");
  process.exit(1);
}

const name = nameArg || (emailArg.split("@")[0] || "admin");
const normalizedEmail = normalizeEmail(emailArg);
if (!normalizedEmail) {
  console.error("Invalid email");
  process.exit(1);
}

const role = roleArg || "superadmin";
const allowedRoles = ["superadmin", "dispatcher", "support", "finance"];
if (!allowedRoles.includes(role)) {
  console.error(`Invalid role ${role}, choose one of ${allowedRoles.join(", ")}`);
  process.exit(1);
}

const main = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const existing = await Admin.findOne({ email: normalizedEmail });
  if (existing) {
    console.log("Admin already exists for", existing.email);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(passwordArg, 10);
  const admin = new Admin({ name, email: normalizedEmail, passwordHash, role });
  await admin.save();

  console.log("Created admin:", { id: admin._id, email: admin.email, role: admin.role });
  await mongoose.disconnect();
};

main().catch((err) => {
  console.error("Failed to create admin", err);
  process.exit(1);
});
