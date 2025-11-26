import express from "express";
import { listFlaggedDevices, unbanDevice } from "../../controllers/admin/fraudAdminController.js";
import { adminAuth } from "../../middleware/adminAuth.js";
import { requireAdminRole } from "../../middleware/adminRoles.js";

const router = express.Router();

router.get(
  "/flagged",
  adminAuth,
  requireAdminRole(["superadmin", "support", "security"]),
  listFlaggedDevices
);

router.post(
  "/unban",
  adminAuth,
  requireAdminRole(["superadmin"]),
  unbanDevice
);

export default router;
