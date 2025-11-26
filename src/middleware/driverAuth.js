import jwt from "jsonwebtoken";
import Driver from "../models/Driver.js";
import { fail } from "../utils/apiResponse.js";

export const driverAuth = async (req, res, next) => {
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

    const driver = await Driver.findById(decoded.driverId);
    if (!driver) return fail(res, "Driver not found", 401);

    req.driver = { id: driver._id, name: driver.name, phone: driver.phone };
    next();
  } catch (err) {
    console.error("driverAuth error:", err);
    return fail(res, "Auth error", 500);
  }
};
