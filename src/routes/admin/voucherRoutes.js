import express from "express";
import { acceptCashPayment, createVoucherForDriver } from "../../controllers/admin/voucherController.js";
import { adminAuth } from "../../middleware/adminAuth.js";
import { requireAdminRole } from "../../middleware/adminRoles.js";

const router = express.Router();

// Branch employees (support) and finance/superadmin can create vouchers
router.post(
  "/create",
  adminAuth,
  requireAdminRole(["superadmin", "finance", "support"]),
  createVoucherForDriver
);

// Accept cash payment and create payment + voucher, optionally activate
router.post(
  "/accept",
  adminAuth,
  requireAdminRole(["superadmin", "finance", "support"]),
  acceptCashPayment
);

export default router;
