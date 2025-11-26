import Voucher from "../../models/Voucher.js";
import { activateDriverSubscription } from "../../services/subscription/subscriptionService.js";

export const redeemVoucher = async (req, res) => {
  try {
    const driverId = req.driver.id;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Voucher code is required" });
    }

    const voucher = await Voucher.findOne({ code, driverId });
    if (!voucher) {
      return res.status(404).json({ error: "Voucher not found for this driver" });
    }

    if (voucher.redeemed) {
      return res.status(400).json({ error: "Voucher already redeemed" });
    }

    const now = new Date();
    if (voucher.expiresAt < now) {
      return res.status(400).json({ error: "Voucher has expired" });
    }

    voucher.redeemed = true;
    voucher.redeemedAt = now;
    voucher.activeFrom = now;
    await voucher.save();

    const updatedDriver = await activateDriverSubscription(driverId);

    res.json({
      message: "Voucher redeemed and subscription activated",
      subscription: updatedDriver.subscription
    });
  } catch (err) {
    console.error("redeemVoucher error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
