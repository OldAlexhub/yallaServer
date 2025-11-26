import AdminLog from '../../models/AdminLog.js';
import CashShift from '../../models/CashShift.js';
import Voucher from '../../models/Voucher.js';

export const startShift = async (req, res) => {
  try {
    const { branch } = req.body;
    const shift = new CashShift({ adminId: req.admin.id, branch });
    await shift.save();

    // log
    const log = new AdminLog({ admin: { id: req.admin.id, email: req.admin.email }, event: 'startShift', severity: 'low', description: `Shift started by ${req.admin.email}` });
    await log.save();

    res.json({ data: shift });
  } catch (err) {
    console.error('startShift error', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getShift = async (req, res) => {
  try {
    const { id } = req.params;
    const shift = await CashShift.findById(id);
    if (!shift) return res.status(404).json({ error: 'Shift not found' });

    // compute expectedCash as sum of vouchers.amountPaid for this shift
    const vouchers = await Voucher.find({ shiftId: shift._id });
    const expectedCash = vouchers.reduce((s, v) => s + (v.amountPaid || 0), 0);

    res.json({ data: { shift, vouchers, expectedCash } });
  } catch (err) {
    console.error('getShift error', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const requestShiftCheckout = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminReportedCash, note } = req.body;
    const shift = await CashShift.findById(id);
    if (!shift) return res.status(404).json({ error: 'Shift not found' });
    if (String(shift.adminId) !== String(req.admin.id)) return res.status(403).json({ error: 'Not your shift' });
    if (shift.status !== 'open') return res.status(400).json({ error: 'Shift not open' });

    // compute expected cash
    const vouchers = await Voucher.find({ shiftId: shift._id });
    const expectedCash = vouchers.reduce((s, v) => s + (v.amountPaid || 0), 0);

    shift.adminReportedCash = adminReportedCash;
    shift.expectedCash = expectedCash;
    shift.status = 'closing_requested';
    shift.note = note || null;

    await shift.save();

    const log = new AdminLog({ admin: { id: req.admin.id, email: req.admin.email }, event: 'requestShiftCheckout', severity: 'medium', description: `Checkout requested by ${req.admin.email}`, metadata: { shiftId: shift._id, adminReportedCash, expectedCash } });
    await log.save();

    res.json({ data: { shift } });
  } catch (err) {
    console.error('requestShiftCheckout error', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const approveShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { supervisorNote } = req.body;
    const shift = await CashShift.findById(id);
    if (!shift) return res.status(404).json({ error: 'Shift not found' });
    if (shift.status !== 'closing_requested') return res.status(400).json({ error: 'Shift not in closing state' });

    // supervisor approves
    shift.supervisorId = req.admin.id;
    shift.supervisorApproved = true;
    shift.status = 'closed';
    shift.closedAt = new Date();
    if (supervisorNote) shift.note = (shift.note || '') + '\nSupervisor: ' + supervisorNote;

    await shift.save();

    const log = new AdminLog({ admin: { id: req.admin.id, email: req.admin.email }, event: 'approveShift', severity: 'high', description: `Shift ${id} approved by ${req.admin.email}`, metadata: { shiftId: id } });
    await log.save();

    res.json({ data: { shift } });
  } catch (err) {
    console.error('approveShift error', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const listPendingShifts = async (req, res) => {
  try {
    const shifts = await CashShift.find({ status: 'closing_requested' }).sort({ createdAt: -1 }).limit(100);
    // compute expectedCash for each
    const results = [];
    for (const s of shifts) {
      const vouchers = await Voucher.find({ shiftId: s._id });
      const expectedCash = vouchers.reduce((sum, v) => sum + (v.amountPaid || 0), 0);
      results.push({ shift: s, expectedCash, vouchersCount: vouchers.length });
    }
    res.json({ data: results });
  } catch (err) {
    console.error('listPendingShifts error', err);
    res.status(500).json({ error: 'Server error' });
  }
};
