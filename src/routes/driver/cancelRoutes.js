import express from "express";
import { driverCancelTrip } from "../../controllers/driver/cancelController.js";
import { markNoShow } from "../../controllers/driver/noShowController.js";
import { deviceFingerprint } from "../../middleware/deviceFingerprint.js";
import { driverAuth } from "../../middleware/driverAuth.js";

const router = express.Router();

router.post("/cancel", deviceFingerprint, driverAuth, driverCancelTrip);
router.post("/no_show", deviceFingerprint, driverAuth, markNoShow);

export default router;
