import express from "express";
import {
    getSubscriptionHistory,
    getSubscriptionStatus
} from "../../controllers/driver/subscriptionController.js";
import { driverAuth } from "../../middleware/driverAuth.js";

const router = express.Router();

router.get("/status", driverAuth, getSubscriptionStatus);
router.get("/history", driverAuth, getSubscriptionHistory);

export default router;
