import express from "express";
import { getHeatZonesPublic } from "../../controllers/shared/heatZonePublicController.js";
import { customerAuth } from "../../middleware/customerAuth.js";

const router = express.Router();

router.get("/list", customerAuth, getHeatZonesPublic);

export default router;
