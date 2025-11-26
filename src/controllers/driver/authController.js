import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Driver from "../../models/Driver.js";
import OnboardingControl from "../../models/OnboardingControl.js";
import ServiceAvailability from "../../models/ServiceAvailability.js";
import {
    checkDeviceBan,
    detectMultiAccounts,
    flagDevice,
    registerDeviceUsage
} from "../../services/fraud/fraudService.js";
import { fail, ok } from "../../utils/apiResponse.js";
import { isValidPhoneEgypt, requireFields } from "../../utils/validators.js";

export const driverSignup = async (req, res) => {
  try {
    // check global service toggles first
    const svc = await ServiceAvailability.findOne();
    if (svc?.disableDriverSignups) return fail(res, 'Driver signups are disabled by the platform', 403);

    // check onboarding control rules
    const control = await OnboardingControl.findOne();
    if (control) {
      // manual lock wins
      if (control.lockOnboarding) return fail(res, 'Driver onboarding is currently locked', 403);

      // if auto mode (overrideMode === false), enforce threshold based on lastCalculatedAvg
      if (!control.overrideMode) {
        const avg = Number(control.lastCalculatedAvg || 0);
        const min = Number(control.minTripsThreshold || 0);
        // if supply is too high (average trips per driver below threshold) block signups
        if (avg < min) {
          return fail(res, 'Onboarding temporarily paused due to low average trips per driver', 403);
        }
      }
    }
    const { name, phone, password, vehicle } = req.body;
    const missing = requireFields(req.body, ["name", "phone", "password"]);
    if (missing.length) return fail(res, `Missing fields: ${missing.join(", ")}`, 400);
    if (!isValidPhoneEgypt(phone)) return fail(res, "Invalid phone format", 400);

    // device ban check
    if (req.deviceId && (await checkDeviceBan(req.deviceId))) {
      return fail(res, "Device banned for suspected fraud", 403);
    }

    const exists = await Driver.findOne({ phone });
    if (exists) return fail(res, "Phone already registered", 409);

    // enforce one-device-one-driver
    if (req.deviceId) {
      const multi = await detectMultiAccounts(req.deviceId);
      if (multi && multi.drivers && multi.drivers.length > 0) {
        return fail(res, "This device is already linked to another driver account", 403);
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const driver = new Driver({
      name,
      phone,
      passwordHash,
      vehicle: vehicle || {}
    });

    await driver.save();

    // register device usage and run multi-account detection
    if (req.deviceId) {
      await registerDeviceUsage(req.deviceId, req.ip, { driverId: driver._id });
      const fraudCheck = await detectMultiAccounts(req.deviceId);
      if (fraudCheck && fraudCheck.suspicious) {
        await flagDevice(req.deviceId, "Multiple driver accounts detected");
      }
    }

    return ok(res, {
      message: "Driver registered successfully",
      driver: { id: driver._id, name: driver.name, phone: driver.phone }
    });
  } catch (err) {
    console.error("driverSignup error:", err);
    return fail(res, "Server error", 500);
  }
};

export const driverLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;
    const missing = requireFields(req.body, ["phone", "password"]);
    if (missing.length) return fail(res, `Missing fields: ${missing.join(", ")}`, 400);

    // device ban check
    if (req.deviceId && (await checkDeviceBan(req.deviceId))) {
      return fail(res, "Device banned for suspected fraud", 403);
    }

    const driver = await Driver.findOne({ phone });
    if (!driver) return fail(res, "Driver not found", 404);

    const valid = await bcrypt.compare(password, driver.passwordHash);
    if (!valid) return fail(res, "Invalid credentials", 401);

    const token = jwt.sign({ driverId: driver._id, phone: driver.phone }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // register device usage on successful login
    if (req.deviceId) {
      await registerDeviceUsage(req.deviceId, req.ip, { driverId: driver._id });
      const fraudCheck = await detectMultiAccounts(req.deviceId);
      if (fraudCheck && fraudCheck.suspicious) {
        await flagDevice(req.deviceId, "Multiple driver accounts detected");
      }
    }

    return ok(res, {
      token,
      driver: {
        id: driver._id,
        name: driver.name,
        phone: driver.phone,
        vehicle: driver.vehicle,
        documents: driver.documents,
        subscription: driver.subscription
      }
    });
  } catch (err) {
    console.error("driverLogin error:", err);
    return fail(res, "Server error", 500);
  }
};
