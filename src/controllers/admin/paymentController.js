import AdminLog from '../../models/AdminLog.js';
import Payment from '../../models/Payment.js';

export const reconcilePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { settlementId, payoutDate, fees } = req.body;

    const payment = await Payment.findById(id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    payment.settlementId = settlementId || payment.settlementId;
    payment.payoutDate = payoutDate ? new Date(payoutDate) : payment.payoutDate;
    payment.fees = typeof fees === 'number' ? fees : payment.fees;
    payment.reconciled = true;

    await payment.save();

    const log = new AdminLog({ admin: { id: req.admin.id, email: req.admin.email }, event: 'reconcilePayment', severity: 'high', description: `Payment ${id} reconciled by ${req.admin.email}`, metadata: { paymentId: id, settlementId } });
    await log.save();

    return res.json({ message: 'Payment reconciled', data: payment });
  } catch (err) {
    console.error('reconcilePayment error', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
