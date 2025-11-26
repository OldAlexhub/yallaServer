import express from "express";
import { getHeatZonesPublic } from "../../controllers/shared/heatZonePublicController.js";
import { driverAuth } from "../../middleware/driverAuth.js";

const router = express.Router();

router.get("/list", driverAuth, getHeatZonesPublic);

export default router;
