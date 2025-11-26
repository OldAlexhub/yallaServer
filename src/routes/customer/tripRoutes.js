import express from "express";
import { getEstimate, getTripHistory, requestTrip } from "../../controllers/customer/tripController.js";
import { customerAuth } from "../../middleware/customerAuth.js";

const router = express.Router();

router.post("/request", customerAuth, requestTrip);
router.post("/estimate", customerAuth, getEstimate);
router.get("/history", customerAuth, getTripHistory);

export default router;
