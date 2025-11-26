import express from "express";
import { adminAuth } from "../../middleware/adminAuth.js";
import { requireAdminRole } from "../../middleware/adminRoles.js";
import PenaltyLog from "../../models/PenaltyLog.js";

const router = express.Router();

router.get(
  "/list",
  adminAuth,
  requireAdminRole(["superadmin", "support", "dispatcher"]),
  async (req, res) => {
    try {
      const penalties = await PenaltyLog.find().sort({ createdAt: -1 }).limit(500);

      res.json({ penalties });
    } catch (err) {
      console.error("admin penalty list error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

export default router;
