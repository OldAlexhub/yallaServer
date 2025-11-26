import express from "express";
import { goOffline, goOnline } from "../../controllers/driver/statusController.js";
import { driverAuth } from "../../middleware/driverAuth.js";
import { requireActiveSubscription } from "../../middleware/subscriptionEnforce.js";

const router = express.Router();

router.post("/online", driverAuth, requireActiveSubscription, goOnline);
router.post("/offline", driverAuth, goOffline);

export default router;
