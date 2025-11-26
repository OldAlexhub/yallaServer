import express from "express";
import adminTripRoutes from "./admin/tripRoutes.js";
import customerTripRoutes from "./customer/tripRoutes.js";
import driverTripRoutes from "./driver/tripRoutes.js";

const router = express.Router();

router.use("/customer", customerTripRoutes);
router.use("/driver", driverTripRoutes);
router.use("/admin", adminTripRoutes);

export default router;
