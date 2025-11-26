import jwt from "jsonwebtoken";
import Customer from "../models/Customer.js";
import { fail } from "../utils/apiResponse.js";

export const customerAuth = async (req, res, next) => {
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

    const customer = await Customer.findById(decoded.customerId);
    if (!customer) return fail(res, "Customer not found", 401);

    req.customer = { id: customer._id, phone: customer.phone, founder: customer.founder };
    next();
  } catch (err) {
    console.error("customerAuth error:", err);
    return fail(res, "Auth error", 500);
  }
};
