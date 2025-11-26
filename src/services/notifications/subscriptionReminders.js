import Voucher from "../../models/Voucher.js";
import { sendMessage } from "./dispatcher.js";
import { driverTemplates } from "./templates.js";

export const processDriverSubscriptionReminders = async (io) => {
  try {
    const now = new Date();
    // find vouchers that were redeemed (active periods)
    const vouchers = await Voucher.find({ redeemed: true }).populate('driverId');
    for (const v of vouchers) {
      if (!v.driverId) continue;
      const driver = v.driverId;
      const expiresAt = v.expiresAt;
      if (!expiresAt) continue;
      const diffMs = expiresAt.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 3) {
        const payload = driverTemplates.subscriptionReminder(3);
        sendMessage(io, { type: 'driver', id: String(driver._id) }, payload);
      } else if (diffDays === 1) {
        const payload = driverTemplates.voucherExpiringTomorrow();
        sendMessage(io, { type: 'driver', id: String(driver._id) }, payload);
      } else if (diffMs < 0) {
        const payload = driverTemplates.voucherExpired();
        sendMessage(io, { type: 'driver', id: String(driver._id) }, payload);
      }
    }
  } catch (err) {
    console.error('processDriverSubscriptionReminders error', err);
  }
};

export default { processDriverSubscriptionReminders };
