import Driver from "../../models/Driver.js";
import Payment from '../../models/Payment.js';
import Voucher from "../../models/Voucher.js";
import communicationService from '../../services/communication/communicationService.js';
import { activateDriverSubscription } from "../../services/subscription/subscriptionService.js";
import { generateVoucherCode } from "../../utils/generateVoucherCode.js";

export const createVoucherForDriver = async (req, res) => {
  try {
    const { driverId, amountPaid, shiftId } = req.body;

    if (!driverId || amountPaid === undefined) {
      return res.status(400).json({ error: "driverId and amountPaid are required" });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    // generate unique code
    let code;
    let exists = true;
    while (exists) {
      code = generateVoucherCode(5);
      const existingVoucher = await Voucher.findOne({ code });
      if (!existingVoucher) exists = false;
    }

    const now = new Date();
    const voucherExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days validity

    const voucherData = {
      code,
      driverId: driver._id,
      adminId: req.admin.id, // from adminAuth middleware
      amountPaid,
      expiresAt: voucherExpiresAt
    };

    if (shiftId) voucherData.shiftId = shiftId;

    const voucher = new Voucher(voucherData);

    await voucher.save();

    // create Payment record for reconciliation
    const payment = new Payment({
      driverId: driver._id,
      amount: amountPaid,
      currency: 'EGP',
      gateway: 'offline',
      status: 'succeeded',
      shiftId: shiftId || null,
      voucherId: voucher._id,
      createdBy: req.admin.id
    });
    await payment.save();

    // If admin requested immediate activation (cash in hand), redeem automatically
    if (req.body.activateNow) {
      const nowActivate = new Date();
      voucher.redeemed = true;
      voucher.redeemedAt = nowActivate;
      voucher.activeFrom = nowActivate;
      await voucher.save();
      await activateDriverSubscription(driver._id);
    }

    // send SMS/notification to driver with code if possible (placeholder service)
    try {
      await communicationService.sendVoucherSms(driver._id, voucher.code, voucher.expiresAt);
    } catch (e) {
      // ignore SMS errors for now
    }

    res.json({
      message: "Voucher created successfully",
      voucher: {
        id: voucher._id,
        code: voucher.code,
        driverId: voucher.driverId,
        amountPaid: voucher.amountPaid,
        expiresAt: voucher.expiresAt,
        redeemed: voucher.redeemed
      }
    });
  } catch (err) {
    console.error("createVoucherForDriver error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const acceptCashPayment = async (req, res) => {
  try {
    const { driverId, amountPaid, shiftId, activateNow } = req.body;
    if (!driverId || amountPaid === undefined) return res.status(400).json({ error: 'driverId and amountPaid are required' });

    // reuse createVoucher logic but ensure Payment is created and optionally redeem
    // generate unique code
    let code;
    let exists = true;
    while (exists) {
      code = generateVoucherCode(5);
      const existingVoucher = await Voucher.findOne({ code });
      if (!existingVoucher) exists = false;
    }

    const now = new Date();
    const voucherExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const voucher = new Voucher({ code, driverId, adminId: req.admin.id, amountPaid, expiresAt: voucherExpiresAt, shiftId: shiftId || null });
    await voucher.save();

    const payment = new Payment({ driverId, amount: amountPaid, currency: 'EGP', gateway: 'offline', status: 'succeeded', shiftId: shiftId || null, voucherId: voucher._id, createdBy: req.admin.id });
    await payment.save();

    if (activateNow) {
      voucher.redeemed = true;
      voucher.redeemedAt = new Date();
      voucher.activeFrom = new Date();
      await voucher.save();
      await activateDriverSubscription(driverId);
    }

    // attempt to notify driver
    try { await communicationService.sendVoucherSms(driverId, code, voucherExpiresAt); } catch (e) {}

    return res.json({ message: 'Cash accepted', data: { voucherId: voucher._id, code, paymentId: payment._id } });
  } catch (err) {
    console.error('acceptCashPayment error', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
