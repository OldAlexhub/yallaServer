import Driver from "../../models/Driver.js";
import Voucher from "../../models/Voucher.js";

export const activateDriverSubscription = async (driverId) => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days

  const driver = await Driver.findByIdAndUpdate(
    driverId,
    {
      $set: {
        "subscription.active": true,
        "subscription.expiresAt": expiresAt
      }
    },
    { new: true }
  );

  return driver;
};

export const ensureSubscriptionValidity = async (driver) => {
  if (!driver.subscription || !driver.subscription.expiresAt) {
    return driver;
  }

  const now = new Date();
  if (driver.subscription.expiresAt < now && driver.subscription.active) {
    driver.subscription.active = false;
    await driver.save();
  }
  return driver;
};

// Sweep function to expire all outdated subscriptions (for cron)
export const sweepExpiredSubscriptions = async () => {
  const now = new Date();

  const result = await Driver.updateMany(
    {
      "subscription.active": true,
      "subscription.expiresAt": { $lt: now }
    },
    {
      $set: { "subscription.active": false }
    }
  );

  return result.modifiedCount || 0;
};

// Get driver subscription history from vouchers
export const getDriverSubscriptionHistory = async (driverId, limit = 20) => {
  const vouchers = await Voucher.find({ driverId })
    .sort({ createdAt: -1 })
    .limit(limit);

  return vouchers;
};
