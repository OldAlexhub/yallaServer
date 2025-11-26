import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import TokenBlacklist from "../models/TokenBlacklist.js";
import { fail } from "../utils/apiResponse.js";

export const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return fail(res, "Missing token", 401);
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return fail(res, "Invalid token", 401);
    }

    // check blacklist
    const black = await TokenBlacklist.findOne({ token });
    if (black) return fail(res, "Token revoked", 401);

    const admin = await Admin.findById(decoded.adminId);
    if (!admin) return fail(res, "Admin not found", 401);

    req.admin = { id: admin._id, role: admin.role, email: admin.email };
    next();
  } catch (err) {
    console.error("adminAuth error:", err);
    return fail(res, "Auth error", 500);
  }
};
