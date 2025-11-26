import Customer from "../../models/Customer.js";
import Driver from "../../models/Driver.js";
import PenaltyLog from "../../models/PenaltyLog.js";

export const recordPenalty = async ({ userType, userId, tripId, actionType, reason, penalty }) => {
  const doc = new PenaltyLog({
    userType,
    userId,
    tripId,
    actionType,
    reason,
    penaltyApplied: !!penalty,
    penalty: penalty || undefined
  });
  await doc.save();
  return doc;
};

// Rolling 7-day window
const getRecentCount = async (userType, userId, actionType) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return PenaltyLog.countDocuments({
    userType,
    userId,
    actionType,
    createdAt: { $gte: sevenDaysAgo }
  });
};

export const applyCustomerPenalty = async (customerId) => {
  const count = await getRecentCount("customer", customerId, "cancel");

  let level = 0;
  let duration = 0;

  if (count >= 3 && count < 5) {
    level = 1;
    duration = 30; // minutes block
  } else if (count >= 5 && count < 7) {
    level = 2;
    duration = 60;
  } else if (count >= 7) {
    level = 3;
    duration = 24 * 60; // 24h block
  }

  if (level === 0) return null;

  const expires = new Date(Date.now() + duration * 60 * 1000);

  const customer = await Customer.findById(customerId);
  if (!customer) return null;

  customer.penalties = customer.penalties || {};
  customer.penalties.blockedUntil = expires;
  await customer.save();

  const penalty = { level, durationMinutes: duration, expiresAt: expires };
  await recordPenalty({ userType: "customer", userId: customerId, actionType: "cancel", reason: "auto_penalty", penalty });

  return penalty;
};

export const applyDriverPenalty = async (driverId) => {
  const count = await getRecentCount("driver", driverId, "ignored_trip");

  let level = 0;
  let duration = 0;

  if (count >= 3 && count < 5) {
    level = 1;
    duration = 10;
  } else if (count >= 5 && count < 7) {
    level = 2;
    duration = 30;
  } else if (count >= 7) {
    level = 3;
    duration = 24 * 60;
  }

  if (level === 0) return null;

  const expires = new Date(Date.now() + duration * 60 * 1000);

  const driver = await Driver.findById(driverId);
  if (!driver) return null;

  driver.penalty = driver.penalty || {};
  driver.penalty.active = true;
  driver.penalty.level = level;
  driver.penalty.expiresAt = expires;
  await driver.save();

  const penalty = { level, durationMinutes: duration, expiresAt: expires };
  await recordPenalty({ userType: "driver", userId: driverId, actionType: "ignored_trip", reason: "auto_penalty", penalty });

  return penalty;
};

export default {
  recordPenalty,
  applyCustomerPenalty,
  applyDriverPenalty
};
