import express from "express";
import {
    approveDriver,
    getDriver,
  listPendingDrivers,
  listDrivers,
  rejectDriver
} from "../../controllers/admin/driverAdminController.js";
import { adminAuth } from "../../middleware/adminAuth.js";
import { requireAdminRole } from "../../middleware/adminRoles.js";

const router = express.Router();

// List pending driver document submissions
router.get(
  "/pending",
  adminAuth,
  requireAdminRole(["superadmin", "dispatcher", "support"]),
  listPendingDrivers
);

// Generic drivers list (supports ?status=&search=&page=&limit=)
router.get(
  "/",
  adminAuth,
  requireAdminRole(["superadmin", "dispatcher", "support"]),
  listDrivers
);

// Get driver details
router.get(
  "/:driverId",
  adminAuth,
  requireAdminRole(["superadmin", "dispatcher", "support"]),
  getDriver
);

// Approve driver documents
router.post(
  "/:driverId/approve",
  adminAuth,
  requireAdminRole(["superadmin", "dispatcher"]),
  approveDriver
);

// Reject driver documents
router.post(
  "/:driverId/reject",
  adminAuth,
  requireAdminRole(["superadmin", "dispatcher"]),
  rejectDriver
);

export default router;
