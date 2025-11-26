import express from "express";
import { getLoyaltyStatus } from "../../controllers/customer/loyaltyController.js";
import { customerAuth } from "../../middleware/customerAuth.js";

const router = express.Router();

router.get("/status", customerAuth, getLoyaltyStatus);

export default router;
