import express from "express";
import {
    createHeatZone,
    deleteHeatZone,
    getZoneStats,
    listHeatZones,
    overrideZone,
    recalcHeatZones,
    updateClusteringParams,
    updateHeatZone
} from "../../controllers/admin/heatZoneController.js";
import { adminAuth } from "../../middleware/adminAuth.js";
import { requireAdminRole } from "../../middleware/adminRoles.js";

const router = express.Router();

// List all heat zones
router.get(
  "/",
  adminAuth,
  requireAdminRole(["superadmin", "dispatcher", "support"]),
  listHeatZones
);

// Get zone stats
router.get(
  "/:zoneId",
  adminAuth,
  requireAdminRole(["superadmin", "dispatcher", "support"]),
  getZoneStats
);

// Override zone state
router.post(
  "/:zoneId/override",
  adminAuth,
  requireAdminRole(["superadmin"]),
  overrideZone
);

// Update clustering parameters
router.post(
  "/clustering",
  adminAuth,
  requireAdminRole(["superadmin"]),
  updateClusteringParams
);

// Create heat zone
router.post(
  "/",
  adminAuth,
  requireAdminRole(["superadmin"]),
  createHeatZone
);

// Update heat zone
router.put(
  "/",
  adminAuth,
  requireAdminRole(["superadmin"]),
  updateHeatZone
);

// Delete heat zone
router.delete(
  "/",
  adminAuth,
  requireAdminRole(["superadmin"]),
  deleteHeatZone
);

// Recalculate heat zones
router.post(
  "/recalculate",
  adminAuth,
  requireAdminRole(["superadmin"]),
  recalcHeatZones
);

export default router;
