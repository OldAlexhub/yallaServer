import express from "express";
import {
    banCustomer,
    clearCustomerPenalties,
    getCustomer,
    getCustomerBehaviorLogs,
    getCustomerReferrals,
    getCustomerTrips,
    listCustomers,
    unbanCustomer,
    updateLoyaltyTier,
} from "../../controllers/admin/customerAdminController.js";
import { adminAuth } from "../../middleware/adminAuth.js";
import { requireAdminRole } from "../../middleware/adminRoles.js";

const router = express.Router();

// Admin can list customers
router.get("/", adminAuth, requireAdminRole(["admin", "superadmin"]), listCustomers);
router.get("/:id", adminAuth, requireAdminRole(["admin", "superadmin"]), getCustomer);
router.get("/:id/trips", adminAuth, requireAdminRole(["admin", "superadmin"]), getCustomerTrips);
router.get("/:id/referrals", adminAuth, requireAdminRole(["admin", "superadmin"]), getCustomerReferrals);
router.post("/:id/ban", adminAuth, requireAdminRole(["admin", "superadmin"]), banCustomer);
router.post("/:id/unban", adminAuth, requireAdminRole(["admin", "superadmin"]), unbanCustomer);
router.post("/:id/clear-penalties", adminAuth, requireAdminRole(["admin", "superadmin"]), clearCustomerPenalties);
router.post("/:id/tier", adminAuth, requireAdminRole(["admin", "superadmin"]), updateLoyaltyTier);
router.get("/:id/behavior", adminAuth, requireAdminRole(["admin", "superadmin"]), getCustomerBehaviorLogs);

export default router;