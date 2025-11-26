import Driver from "../../models/Driver.js";
import { getDriverSubscriptionHistory } from "../../services/subscription/subscriptionService.js";

export const getSubscriptionStatus = async (req, res) => {
  try {
    const driverId = req.driver.id;
    const driver = await Driver.findById(driverId).select("subscription");

    if (!driver) return res.status(404).json({ error: "Driver not found" });

    res.json({
      active: driver.subscription?.active || false,
      expiresAt: driver.subscription?.expiresAt || null
    });
  } catch (err) {
    console.error("getSubscriptionStatus error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getSubscriptionHistory = async (req, res) => {
  try {
    const driverId = req.driver.id;
    const history = await getDriverSubscriptionHistory(driverId, 50);

    res.json({ vouchers: history });
  } catch (err) {
    console.error("getSubscriptionHistory error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export default { getSubscriptionStatus, getSubscriptionHistory };
