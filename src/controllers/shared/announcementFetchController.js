import Announcement from "../../models/Announcement.js";
import AnnouncementRead from "../../models/AnnouncementRead.js";

export const fetchAnnouncements = async (req, res) => {
  try {
    const userType = req.userType; // "customer" or "driver"
    const userId = req.userId;

    const now = new Date();

    let criteria = {
      active: true,
      $or: []
    };

    // Global targets
    if (userType === "customer") criteria.$or.push({ target: "all_customers" });
    if (userType === "driver") criteria.$or.push({ target: "all_drivers" });

    // Active driver announcements
    if (userType === "driver") criteria.$or.push({ target: "active_drivers" });

    // Direct user targeting
    if (userType === "customer") criteria.$or.push({ target: "specific_customer", customerId: userId });

    if (userType === "driver") criteria.$or.push({ target: "specific_driver", driverId: userId });

    // Expiry filter
    criteria.$or.push({ expiresAt: null });
    criteria.$or.push({ expiresAt: { $gte: now } });

    const ann = await Announcement.find(criteria).sort({ createdAt: -1 }).limit(50);

    // attach read flag
    const annIds = ann.map((a) => a._id);
    const reads = await AnnouncementRead.find({ announcementId: { $in: annIds }, userType, userId });
    const readSet = new Set(reads.map((r) => String(r.announcementId)));

    const out = ann.map((a) => ({ ...a.toObject(), read: readSet.has(String(a._id)) }));

    res.json({ announcements: out });
  } catch (err) {
    console.error("fetchAnnouncements error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const markAnnouncementRead = async (req, res) => {
  try {
    const userType = req.userType;
    const userId = req.userId;
    const { announcementId } = req.body;

    const existing = await AnnouncementRead.findOne({ announcementId, userType, userId });

    if (!existing) {
      await AnnouncementRead.create({ announcementId, userType, userId });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("markAnnouncementRead error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export default { fetchAnnouncements, markAnnouncementRead };
