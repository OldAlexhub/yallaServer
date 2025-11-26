import express from "express";
import {
    getSettings,
    toggleServiceAvailability,
    updateAISettings,
    updateCategories,
    updateFareStructure,
    updateFounderLimit,
    updateGeofence,
    updateGlobalMessage,
    updateMatchingConfig,
    updatePenalties,
    updateSubscriptionSettings,
    updateVehicleModelYear
} from "../../controllers/admin/settingsController.js";
import { adminAuth } from "../../middleware/adminAuth.js";
import { requireAdminRole } from "../../middleware/adminRoles.js";

const router = express.Router();

router.get("/", adminAuth, getSettings);

router.post("/fare", adminAuth, requireAdminRole(["superadmin"]), updateFareStructure);
router.post("/geofence", adminAuth, requireAdminRole(["superadmin"]), updateGeofence);
router.post("/founder-limit", adminAuth, requireAdminRole(["superadmin"]), updateFounderLimit);
router.post("/penalties", adminAuth, requireAdminRole(["superadmin"]), updatePenalties);
router.post("/matching", adminAuth, requireAdminRole(["superadmin"]), updateMatchingConfig);
router.post("/vehicle-year", adminAuth, requireAdminRole(["superadmin"]), updateVehicleModelYear);
router.post("/categories", adminAuth, requireAdminRole(["superadmin"]), updateCategories);
router.post("/service-toggle", adminAuth, requireAdminRole(["superadmin"]), toggleServiceAvailability);
router.post("/global-message", adminAuth, requireAdminRole(["superadmin"]), updateGlobalMessage);
router.post("/ai", adminAuth, requireAdminRole(["superadmin"]), updateAISettings);
router.post("/subscription", adminAuth, requireAdminRole(["superadmin"]), updateSubscriptionSettings);

export default router;