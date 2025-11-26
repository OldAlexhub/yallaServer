import express from "express";
import {
    callCenterAssignDriver,
    callCenterCreateTrip,
    callCenterFindNearbyDrivers,
    callCenterOverrideStatus,
    callCenterReassignDriver
} from "../../controllers/admin/manualDispatchController.js";
import { adminAuth } from "../../middleware/adminAuth.js";
import { requireAdminRole } from "../../middleware/adminRoles.js";

const router = express.Router();

router.post(
  "/create",
  adminAuth,
  requireAdminRole(["superadmin", "dispatcher"]),
  callCenterCreateTrip
);

router.post(
  "/assign",
  adminAuth,
  requireAdminRole(["superadmin", "dispatcher"]),
  callCenterAssignDriver
);

router.post(
  "/reassign",
  adminAuth,
  requireAdminRole(["superadmin", "dispatcher"]),
  callCenterReassignDriver
);

router.post(
  "/override-status",
  adminAuth,
  requireAdminRole(["superadmin", "dispatcher"]),
  callCenterOverrideStatus
);

router.post(
  "/nearby-drivers",
  adminAuth,
  requireAdminRole(["superadmin", "dispatcher"]),
  callCenterFindNearbyDrivers
);

export default router;
