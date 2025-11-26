import Announcement from "../../models/Announcement.js";
import { io } from "../../utils/io.js";

export const broadcastAnnouncement = (announcement) => {
  try {
    const driverNs = io.of("/driver");
    const customerNs = io.of("/customer");

    switch (announcement.target) {
      case "all_customers":
        customerNs.emit("announcement:new", announcement);
        break;

      case "all_drivers":
        driverNs.emit("announcement:new", announcement);
        break;

      case "active_drivers":
        driverNs.emit("announcement:new", announcement);
        break;

      case "specific_customer":
        if (announcement.customerId)
          customerNs.to(String(announcement.customerId)).emit("announcement:new", announcement);
        break;

      case "specific_driver":
        if (announcement.driverId)
          driverNs.to(String(announcement.driverId)).emit("announcement:new", announcement);
        break;
    }
  } catch (err) {
    console.error("broadcastAnnouncement error:", err);
  }
};

export const createAnnouncement = async (req, res) => {
  try {
    const { title, message, target, customerId, driverId, type, expiresAt } = req.body;

    if (!title || !message || !target) {
      return res.status(400).json({ error: "title, message, and target are required" });
    }

    const ann = new Announcement({
      title,
      message,
      target,
      customerId: customerId || null,
      driverId: driverId || null,
      type: type || "banner",
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });

    await ann.save();

    // Broadcast realtime
    broadcastAnnouncement(ann);

    res.json({ success: true, announcement: ann });
  } catch (err) {
    console.error("createAnnouncement error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const listAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json({ announcements });
  } catch (err) {
    console.error("listAnnouncements error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const deactivateAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.body;

    const ann = await Announcement.findByIdAndUpdate(announcementId, { active: false }, { new: true });

    if (!ann) return res.status(404).json({ error: "Announcement not found" });

    res.json({ success: true, announcement: ann });
  } catch (err) {
    console.error("deactivateAnnouncement error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export default { createAnnouncement, listAnnouncements, deactivateAnnouncement, broadcastAnnouncement };
