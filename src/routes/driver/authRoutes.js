import express from "express";
import { driverLogin, driverSignup } from "../../controllers/driver/authController.js";
import { requestPasswordReset, resetPassword, sendOtp, verifyOtp } from "../../controllers/driver/otpController.js";
import { deviceFingerprint } from "../../middleware/deviceFingerprint.js";
import requirePhoneForToken from "../../middleware/requirePhoneForToken.js";

const router = express.Router();

router.post("/signup", deviceFingerprint, driverSignup);
// Enforce phone on driver login (tokens are issued)
router.post("/login", deviceFingerprint, requirePhoneForToken, driverLogin);

// OTP flows
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);

export default router;
