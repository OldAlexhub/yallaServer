import express from "express";
import { adminAuth } from "../../middleware/adminAuth.js";
import { requireAdminRole } from "../../middleware/adminRoles.js";
import { sendMessage } from "../../services/notifications/dispatcher.js";
import { customerTemplates, driverTemplates } from "../../services/notifications/templates.js";

const router = express.Router();

// POST /admin/comm/customer/:customerId { template, payload }
router.post('/customer/:customerId', adminAuth, requireAdminRole(["superadmin","dispatcher","support"]), async (req, res) => {
  try {
    const { customerId } = req.params;
    const { template, payload } = req.body;
    const tplFn = customerTemplates[template];
    if (!tplFn) return res.status(400).json({ success: false, error: 'Unknown template' });
    const message = tplFn && typeof tplFn === 'function' ? tplFn(...(payload && payload.args ? payload.args : [payload])) : tplFn;
    sendMessage(req.io, { type: 'customer', id: String(customerId) }, message);
    return res.json({ success: true });
  } catch (err) {
    console.error('admin comm customer error', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.post('/driver/:driverId', adminAuth, requireAdminRole(["superadmin","dispatcher","support"]), async (req, res) => {
  try {
    const { driverId } = req.params;
    const { template, payload } = req.body;
    const tplFn = driverTemplates[template];
    if (!tplFn) return res.status(400).json({ success: false, error: 'Unknown template' });
    const message = tplFn && typeof tplFn === 'function' ? tplFn(...(payload && payload.args ? payload.args : [payload])) : tplFn;
    sendMessage(req.io, { type: 'driver', id: String(driverId) }, message);
    return res.json({ success: true });
  } catch (err) {
    console.error('admin comm driver error', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.post('/broadcast/customers', adminAuth, requireAdminRole(["superadmin","dispatcher","support"]), async (req, res) => {
  try {
    const { template, payload } = req.body;
    const tplFn = customerTemplates[template];
    if (!tplFn) return res.status(400).json({ success: false, error: 'Unknown template' });
    const message = tplFn && typeof tplFn === 'function' ? tplFn(...(payload && payload.args ? payload.args : [payload])) : tplFn;
    sendMessage(req.io, { type: 'all_customers' }, message);
    return res.json({ success: true });
  } catch (err) {
    console.error('broadcast customers error', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.post('/broadcast/drivers', adminAuth, requireAdminRole(["superadmin","dispatcher","support"]), async (req, res) => {
  try {
    const { template, payload } = req.body;
    const tplFn = driverTemplates[template];
    if (!tplFn) return res.status(400).json({ success: false, error: 'Unknown template' });
    const message = tplFn && typeof tplFn === 'function' ? tplFn(...(payload && payload.args ? payload.args : [payload])) : tplFn;
    sendMessage(req.io, { type: 'all_drivers' }, message);
    return res.json({ success: true });
  } catch (err) {
    console.error('broadcast drivers error', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.post('/broadcast/zone', adminAuth, requireAdminRole(["superadmin","dispatcher","support"]), async (req, res) => {
  try {
    const { template, payload, driverIds } = req.body;
    const tplFn = driverTemplates[template] || customerTemplates[template];
    if (!tplFn) return res.status(400).json({ success: false, error: 'Unknown template' });
    const message = tplFn && typeof tplFn === 'function' ? tplFn(...(payload && payload.args ? payload.args : [payload])) : tplFn;
    sendMessage(req.io, { type: 'zone_drivers', driverIds: driverIds || [] }, message);
    return res.json({ success: true });
  } catch (err) {
    console.error('broadcast zone error', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.post('/trip/:tripId', adminAuth, requireAdminRole(["superadmin","dispatcher","support"]), async (req, res) => {
  try {
    const { tripId } = req.params;
    const { template, payload } = req.body;
    const tplFn = customerTemplates[template] || driverTemplates[template];
    if (!tplFn) return res.status(400).json({ success: false, error: 'Unknown template' });
    const message = tplFn && typeof tplFn === 'function' ? tplFn(...(payload && payload.args ? payload.args : [payload])) : tplFn;
    sendMessage(req.io, { type: 'trip_group', tripId }, message);
    return res.json({ success: true });
  } catch (err) {
    console.error('admin comm trip error', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
