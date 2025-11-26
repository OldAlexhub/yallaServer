import express from "express";
import { customerCancelTrip } from "../../controllers/customer/cancelController.js";
import { customerAuth } from "../../middleware/customerAuth.js";
import { deviceFingerprint } from "../../middleware/deviceFingerprint.js";

const router = express.Router();

router.post("/cancel", deviceFingerprint, customerAuth, customerCancelTrip);

export default router;
