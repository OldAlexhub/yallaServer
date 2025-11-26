import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Customer from "../../models/Customer.js";
import {
    checkDeviceBan,
    detectMultiAccounts,
    flagDevice,
    registerDeviceUsage
} from "../../services/fraud/fraudService.js";
import { assignLoyaltyTierOnSignup } from "../../services/loyalty/loyaltyService.js";
import { fail, ok } from "../../utils/apiResponse.js";
import { isValidPhoneEgypt, requireFields } from "../../utils/validators.js";

export const customerSignup = async (req, res) => {
  try {
    console.log('customerSignup called', req.body, req.deviceId, req.ip);
    const { name, phone, password, referralCode } = req.body;
    // basic validation
    const missing = requireFields(req.body, ["name", "phone", "password"]);
    if (missing.length) return fail(res, "Missing required fields", 400, { code: "MISSING_FIELDS", fields: missing });
    if (!isValidPhoneEgypt(phone)) return fail(res, "Invalid phone format", 400, { code: "INVALID_PHONE" });

    // device-level ban check
    if (req.deviceId && (await checkDeviceBan(req.deviceId))) {
      console.log('Device banned for customer signup', req.deviceId);
      return fail(res, "Device banned for suspected fraud", 403, { code: "DEVICE_BANNED" });
    }

    const exists = await Customer.findOne({ phone });
    if (exists) {
      console.log('Phone already registered', phone);
      return fail(res, "Phone already registered", 409, { code: "PHONE_REGISTERED" });
    }

    // enforce one device -> one customer account
    if (req.deviceId) {
      const multi = await detectMultiAccounts(req.deviceId);
        if (multi && multi.customers && multi.customers.length > 0) {
        console.log('Device linked to another customer', req.deviceId, multi.customers);
        return fail(res, "This device is already linked to another customer account", 403, { code: "DEVICE_LINKED" });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const customer = new Customer({ name, phone, passwordHash });
    customer.banned = false; // Ensure not banned on creation
    await customer.save();
    console.log('Customer saved', customer._id, customer.phone);

    // register device usage and run multi-account detection
    if (req.deviceId) {
      await registerDeviceUsage(req.deviceId, req.ip, { customerId: customer._id });
      const fraudCheck = await detectMultiAccounts(req.deviceId);
      if (fraudCheck && fraudCheck.suspicious) {
        await flagDevice(req.deviceId, "Multiple customer accounts detected");
      }
    }

    // loyalty + founder logic
    await assignLoyaltyTierOnSignup(customer, referralCode || null);

    return ok(res, {
      message: "Customer registered successfully",
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        founder: customer.founder,
        loyalty: customer.loyalty
      }
    });
  } catch (err) {
    console.error("customerSignup error:", err);
    return fail(res, "Server error", 500);
  }
};

export const customerLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;
    const missing = requireFields(req.body, ["phone", "password"]);
    if (missing.length) return fail(res, "Missing required fields", 400, { code: "MISSING_FIELDS", fields: missing });

    // device-level ban check
    if (req.deviceId && (await checkDeviceBan(req.deviceId))) {
      return fail(res, "Device banned for suspected fraud", 403, { code: "DEVICE_BANNED" });
    }

    const customer = await Customer.findOne({ phone });
    if (!customer) return fail(res, "Customer not found", 404, { code: "CUSTOMER_NOT_FOUND" });

    const valid = await bcrypt.compare(password, customer.passwordHash);
    if (!valid) return fail(res, "Invalid credentials", 401, { code: "INVALID_CREDENTIALS" });

    // Defensive: ensure phone is present in account before issuing tokens
    if (!customer.phone) {
      console.error("customerLogin: customer record missing phone:", customer._id);
      return fail(res, "Account data incomplete: phone missing. Contact support.", 500, { code: "ACCOUNT_INCOMPLETE" });
    }

    const token = jwt.sign(
      {
        customerId: customer._id,
        phone: customer.phone,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // register device usage on successful login
    if (req.deviceId) {
      await registerDeviceUsage(req.deviceId, req.ip, { customerId: customer._id });
      const fraudCheck = await detectMultiAccounts(req.deviceId);
      if (fraudCheck && fraudCheck.suspicious) {
        await flagDevice(req.deviceId, "Multiple customer accounts detected");
      }
    }

    return ok(res, {
      token,
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        founder: customer.founder,
        loyalty: customer.loyalty
      }
    });
  } catch (err) {
    console.error("customerLogin error:", err);
    return fail(res, "Server error", 500);
  }
};

export const getProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer.id).select('name phone founder loyalty createdAt');
    if (!customer) return fail(res, "Customer not found", 404);

    return ok(res, {
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        founder: customer.founder,
        loyalty: customer.loyalty,
        joinedAt: customer.createdAt
      }
    });
  } catch (err) {
    console.error("getProfile error:", err);
    return fail(res, "Server error", 500);
  }
};

