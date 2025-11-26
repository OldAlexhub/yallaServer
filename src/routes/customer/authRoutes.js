import express from "express";
import { customerLogin, customerSignup, getProfile } from "../../controllers/customer/authController.js";
import { customerAuth } from "../../middleware/customerAuth.js";
import { deviceFingerprint } from "../../middleware/deviceFingerprint.js";
import requirePhoneForToken from "../../middleware/requirePhoneForToken.js";

const router = express.Router();

router.post("/signup", deviceFingerprint, customerSignup);
// Enforce phone on login (this route issues JWT tokens)
router.post("/login", deviceFingerprint, requirePhoneForToken, customerLogin);
router.get("/profile", customerAuth, getProfile);

export default router;
