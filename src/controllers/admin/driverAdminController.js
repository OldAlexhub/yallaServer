import Driver from "../../models/Driver.js";
import { sendMessage } from "../../services/notifications/dispatcher.js";
import templates from "../../services/notifications/templates.js";

export const listPendingDrivers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const q = { "documents.status": "pending" };
    const drivers = await Driver.find(q)
      .select("name phone documents createdAt")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Driver.countDocuments(q);
    res.json({ drivers, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("listPendingDrivers error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const listDrivers = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const q = {};
    if (status) {
      if (status === 'pending') q['documents.status'] = 'pending';
      else q['documents.status'] = status;
    }
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), 'i');
      q.$or = [{ name: re }, { phone: re }];
    }

    const drivers = await Driver.find(q)
      .select('name phone vehicle documents createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Driver.countDocuments(q);
    res.json({ drivers, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('listDrivers error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.driverId).select("name phone vehicle documents subscription createdAt");
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    res.json({ driver });
  } catch (err) {
    console.error("getDriver error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const approveDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.driverId);
    if (!driver) return res.status(404).json({ error: "Driver not found" });

    driver.documents.status = "approved";
    await driver.save();

    // send socket notification to driver if possible
    try {
      const payload = templates.driverTemplates.approval();
      sendMessage(req.io, { type: "driver", id: String(driver._id) }, payload);
    } catch (notifyErr) {
      console.warn("approveDriver: notification failed", notifyErr);
    }

    res.json({ message: "Driver approved", driver });
  } catch (err) {
    console.error("approveDriver error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const rejectDriver = async (req, res) => {
  try {
    const { reason = "Not approved" } = req.body || {};
    const driver = await Driver.findById(req.params.driverId);
    if (!driver) return res.status(404).json({ error: "Driver not found" });

    driver.documents.status = "rejected";
    await driver.save();

    try {
      const payload = templates.driverTemplates.rejection(reason);
      sendMessage(req.io, { type: "driver", id: String(driver._id) }, payload);
    } catch (notifyErr) {
      console.warn("rejectDriver: notification failed", notifyErr);
    }

    res.json({ message: "Driver rejected", driver });
  } catch (err) {
    console.error("rejectDriver error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export default { listPendingDrivers, listDrivers, getDriver, approveDriver, rejectDriver };
