import Driver from "../models/Driver.js";
import { ensureSubscriptionValidity } from "../services/subscription/subscriptionService.js";

export const requireActiveSubscription = async (req, res, next) => {
  try {
    const driverId = req.driver?.id;
    if (!driverId) {
      return res.status(401).json({ error: "Driver auth required" });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ error: "Driver not found" });

    await ensureSubscriptionValidity(driver);

    if (!driver.subscription || !driver.subscription.active) {
      return res.status(403).json({
        error: "Subscription inactive. Please pay your weekly fee and redeem a voucher."
      });
    }

    next();
  } catch (err) {
    console.error("requireActiveSubscription error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export default { requireActiveSubscription };
