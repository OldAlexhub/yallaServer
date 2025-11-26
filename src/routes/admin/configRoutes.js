import express from "express";
import { getFounderLimit, updateFounderLimit } from "../../controllers/admin/configController.js";
import { adminAuth } from "../../middleware/adminAuth.js";
import { requireAdminRole } from "../../middleware/adminRoles.js";

const router = express.Router();

router.get(
  "/founder-limit",
  adminAuth,
  requireAdminRole(["superadmin"]),
  getFounderLimit
);

router.post(
  "/founder-limit",
  adminAuth,
  requireAdminRole(["superadmin"]),
  updateFounderLimit
);

export default router;
