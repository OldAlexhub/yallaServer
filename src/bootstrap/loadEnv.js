import dotenv from "dotenv";
dotenv.config();

const required = ["MONGO_URI", "JWT_SECRET"];
const missing = required.filter((k) => !process.env[k]);

if (missing.length > 0) {
  console.error("Missing ENV:", missing.join(", "));
  process.exit(1);
}

export default true;
