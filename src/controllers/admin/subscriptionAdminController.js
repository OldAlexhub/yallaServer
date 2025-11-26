import Driver from "../../models/Driver.js";
import { sweepExpiredSubscriptions } from "../../services/subscription/subscriptionService.js";

export const listDriverSubscriptions = async (req, res) => {
  try {
    const { status } = req.query; // "active" | "inactive" | "all"

    const filter = {};
    if (status === "active") {
      filter["subscription.active"] = true;
    } else if (status === "inactive") {
      filter["subscription.active"] = { $ne: true };
    }

    const drivers = await Driver.find(filter)
      .select("name phone subscription")
      .sort({ "subscription.expiresAt": 1 });

    res.json({ drivers });
  } catch (err) {
    console.error("listDriverSubscriptions error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const adminAdjustSubscription = async (req, res) => {
  try {
    const { driverId, active, expiresAt } = req.body;

    const update = {};
    if (active !== undefined) update["subscription.active"] = active;
    if (expiresAt) update["subscription.expiresAt"] = new Date(expiresAt);

    const driver = await Driver.findByIdAndUpdate(
      driverId,
      { $set: update },
      { new: true }
    ).select("name phone subscription");

    if (!driver) return res.status(404).json({ error: "Driver not found" });

    res.json({ success: true, driver });
  } catch (err) {
    console.error("adminAdjustSubscription error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const adminSweepExpired = async (req, res) => {
  try {
    const count = await sweepExpiredSubscriptions();
    res.json({ success: true, expiredDeactivated: count });
  } catch (err) {
    console.error("adminSweepExpired error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export default { listDriverSubscriptions, adminAdjustSubscription, adminSweepExpired };
