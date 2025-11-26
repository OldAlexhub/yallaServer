import express from "express";
import { redeemVoucher } from "../../controllers/driver/voucherController.js";
import { driverAuth } from "../../middleware/driverAuth.js";

const router = express.Router();

router.post("/redeem", driverAuth, redeemVoucher);

export default router;
