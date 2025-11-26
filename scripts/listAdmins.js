import "../src/bootstrap/loadEnv.js";
import mongoose from "mongoose";
import Admin from "../src/models/Admin.js";

const main = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const admins = await Admin.find({}, "name email role createdAt").lean();
  console.log("Admins:", admins);
  await mongoose.disconnect();
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
