import express from "express";
import { adjustCustomerTier, listFounders, searchByReferralCode } from "../../controllers/admin/loyaltyAdminController.js";
import { adminAuth } from "../../middleware/adminAuth.js";
import { requireAdminRole } from "../../middleware/adminRoles.js";

const router = express.Router();

router.get(
  "/founders",
  adminAuth,
  requireAdminRole(["superadmin", "support"]),
  listFounders
);

router.post(
  "/search-code",
  adminAuth,
  requireAdminRole(["superadmin", "support"]),
  searchByReferralCode
);

router.post(
  "/adjust-tier",
  adminAuth,
  requireAdminRole(["superadmin"]),
  adjustCustomerTier
);

export default router;
