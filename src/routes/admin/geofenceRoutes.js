import express from "express";
import {
    createGeofenceArea,
    listGeofenceAreas,
    updateGeofenceArea
} from "../../controllers/admin/geofenceController.js";
import { adminAuth } from "../../middleware/adminAuth.js";
import { requireAdminRole } from "../../middleware/adminRoles.js";

const router = express.Router();

router.post(
  "/create",
  adminAuth,
  requireAdminRole(["superadmin"]),
  createGeofenceArea
);

router.put(
  "/update",
  adminAuth,
  requireAdminRole(["superadmin"]),
  updateGeofenceArea
);

router.get(
  "/list",
  adminAuth,
  requireAdminRole(["superadmin", "dispatcher", "support"]),
  listGeofenceAreas
);

export default router;
