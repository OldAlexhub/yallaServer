import FraudDevice from "../../models/FraudDevice.js";

export const registerDeviceUsage = async (deviceId, ip, user = {}) => {
  const entry = await FraudDevice.findOneAndUpdate(
    {
      deviceId
    },
    {
      ip,
      ...(user.customerId ? { customerId: user.customerId } : {}),
      ...(user.driverId ? { driverId: user.driverId } : {})
    },
    { new: true, upsert: true }
  );

  return entry;
};

export const checkDeviceBan = async (deviceId) => {
  const doc = await FraudDevice.findOne({ deviceId });
  if (!doc) return false;
  return doc.deviceBan === true;
};

export const flagDevice = async (deviceId, reason) => {
  return FraudDevice.findOneAndUpdate(
    { deviceId },
    {
      flagged: true,
      reason,
      deviceBan: true,
      bannedAt: new Date()
    },
    { new: true }
  );
};

export const detectMultiAccounts = async (deviceId) => {
  const entries = await FraudDevice.find({ deviceId });
  if (!entries.length) return false;

  const linkedCustomers = entries
    .map((e) => e.customerId)
    .filter((x) => x !== null);

  const linkedDrivers = entries
    .map((e) => e.driverId)
    .filter((x) => x !== null);

  let suspicious = false;

  if (linkedCustomers.length > 1) suspicious = true;
  if (linkedDrivers.length > 1) suspicious = true;

  return {
    suspicious,
    customers: linkedCustomers,
    drivers: linkedDrivers
  };
};
