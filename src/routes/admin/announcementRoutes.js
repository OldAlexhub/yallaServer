import express from "express";
import { createAnnouncement, deactivateAnnouncement, listAnnouncements } from "../../controllers/admin/announcementController.js";
import { adminAuth } from "../../middleware/adminAuth.js";
import { requireAdminRole } from "../../middleware/adminRoles.js";

const router = express.Router();

router.post(
  "/create",
  adminAuth,
  requireAdminRole(["superadmin"]),
  createAnnouncement
);

router.get(
  "/list",
  adminAuth,
  requireAdminRole(["superadmin", "dispatcher", "support"]),
  listAnnouncements
);

router.put(
  "/deactivate",
  adminAuth,
  requireAdminRole(["superadmin"]),
  deactivateAnnouncement
);

export default router;
