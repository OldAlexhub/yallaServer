import { flagDevice } from "./fraudService.js";

export const behaviorCheckCustomer = async (customer, deviceId) => {
  const cancelCount7Days = (customer.penalties && customer.penalties.cancelCount7Days) || 0;
  const noShowCount7Days = (customer.penalties && customer.penalties.noShowCount7Days) || 0;

  if (cancelCount7Days > 7 || noShowCount7Days > 4) {
    await flagDevice(deviceId, "Customer abuse: excessive cancels/no-shows");
  }
};

export const behaviorCheckDriver = async (driver, deviceId) => {
  const ignored = driver?.ignoredTrips7Days || 0;

  if (ignored > 10) {
    await flagDevice(deviceId, "Driver abuse: excessive ignored trips");
  }
};
