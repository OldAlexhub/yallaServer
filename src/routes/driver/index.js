import express from "express";
const router = express.Router();

import announcementRoutes from "./announcementRoutes.js";
import authRoutes from "./authRoutes.js";
import cancelRoutes from "./cancelRoutes.js";
import documentRoutes from "./documentRoutes.js";
import heatZoneRoutes from "./heatZoneRoutes.js";
import statusRoutes from "./statusRoutes.js";
import subscriptionRoutes from "./subscriptionRoutes.js";
import tripRoutes from "./tripRoutes.js";
import voucherRoutes from "./voucherRoutes.js";

router.use("/announcement", announcementRoutes);
router.use("/auth", authRoutes);
router.use("/cancel", cancelRoutes);
router.use("/document", documentRoutes);
router.use("/heat-zone", heatZoneRoutes);
router.use("/status", statusRoutes);
router.use("/subscription", subscriptionRoutes);
router.use("/trip", tripRoutes);
router.use("/voucher", voucherRoutes);

export default router;
