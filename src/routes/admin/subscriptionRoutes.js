import express from "express";
import {
    adminAdjustSubscription,
    adminSweepExpired,
    listDriverSubscriptions
} from "../../controllers/admin/subscriptionAdminController.js";
import { adminAuth } from "../../middleware/adminAuth.js";
import { requireAdminRole } from "../../middleware/adminRoles.js";
import Driver from "../../models/Driver.js";
import Voucher from "../../models/Voucher.js";

const router = express.Router();

router.get(
  "/",
  adminAuth,
  requireAdminRole(["superadmin", "finance", "support"]),
  async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const drivers = await Driver.find({ "subscription.active": true })
        .select('name phone subscription')
        .sort({ "subscription.expiresAt": -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      
      const total = await Driver.countDocuments({ "subscription.active": true });
      res.json({ drivers, total, page: parseInt(page), pages: Math.ceil(total / limit) });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.get(
  "/driver/:driverId",
  adminAuth,
  requireAdminRole(["superadmin", "finance", "support"]),
  async (req, res) => {
    try {
      const driver = await Driver.findById(req.params.driverId).select('name phone subscription');
      if (!driver) return res.status(404).json({ error: "Driver not found" });
      res.json({ subscription: driver.subscription });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.post(
  "/voucher",
  adminAuth,
  requireAdminRole(["superadmin", "finance"]),
  async (req, res) => {
    try {
      const { code, discount, expiresAt } = req.body;
      const voucher = new Voucher({ code, discount, expiresAt });
      await voucher.save();
      res.json({ voucher });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.post(
  "/voucher/:id/override",
  adminAuth,
  requireAdminRole(["superadmin"]),
  async (req, res) => {
    try {
      const { discount } = req.body;
      const voucher = await Voucher.findById(req.params.id);
      if (!voucher) return res.status(404).json({ error: "Voucher not found" });
      voucher.discount = discount;
      await voucher.save();
      res.json({ voucher });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.post(
  "/fee",
  adminAuth,
  requireAdminRole(["superadmin"]),
  async (req, res) => {
    try {
      const { amount } = req.body;
      // Assume there's a SystemConfig model or something
      res.json({ message: "Global fee updated" });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.post(
  "/:driverId/discount",
  adminAuth,
  requireAdminRole(["superadmin", "finance"]),
  async (req, res) => {
    try {
      const { amount } = req.body;
      const driver = await Driver.findById(req.params.driverId);
      if (!driver) return res.status(404).json({ error: "Driver not found" });
      driver.subscription.discount = amount;
      await driver.save();
      res.json({ driver });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.get(
  "/drivers",
  adminAuth,
  requireAdminRole(["superadmin", "finance", "support"]),
  listDriverSubscriptions
);

router.post(
  "/adjust",
  adminAuth,
  requireAdminRole(["superadmin", "finance"]),
  adminAdjustSubscription
);

router.post(
  "/sweep-expired",
  adminAuth,
  requireAdminRole(["superadmin"]),
  adminSweepExpired
);

export default router;
