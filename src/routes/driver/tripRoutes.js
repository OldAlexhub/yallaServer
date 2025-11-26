import express from "express";
import { acceptTrip, arrivedTrip, completeTrip, rejectTrip, startTrip } from "../../controllers/driver/tripController.js";
import { driverAuth } from "../../middleware/driverAuth.js";
import { requireActiveSubscription } from "../../middleware/subscriptionEnforce.js";

const router = express.Router();

router.post("/accept", driverAuth, requireActiveSubscription, acceptTrip);
router.post("/reject", driverAuth, requireActiveSubscription, rejectTrip);
router.post("/arrived", driverAuth, requireActiveSubscription, arrivedTrip);
router.post("/start", driverAuth, requireActiveSubscription, startTrip);
router.post("/complete", driverAuth, requireActiveSubscription, completeTrip);

export default router;
