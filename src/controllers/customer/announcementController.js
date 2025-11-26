import Announcement from "../../models/Announcement.js";
import AnnouncementRead from "../../models/AnnouncementRead.js";
import { fail, ok } from "../../utils/apiResponse.js";

export const listAnnouncements = async (req, res) => {
  try {
    const customerId = req.customer && req.customer.id;
    if (!customerId) {
      return fail(res, "Unauthorized", 401);
    }

    const now = new Date();
    const announcements = await Announcement.find({
      active: true,
      $or: [
        { target: "all_customers" },
        { target: "specific_customer", customerId }
      ],
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: now } }
      ]
    }).sort({ createdAt: -1 });

    // Get read status
    const readIds = await AnnouncementRead.find({
      userType: "customer",
      userId: customerId,
      announcementId: { $in: announcements.map(a => a._id) }
    }).distinct("announcementId");

    const result = announcements.map(ann => ({
      _id: ann._id,
      title: ann.title,
      message: ann.message,
      type: ann.type,
      read: readIds.includes(ann._id),
      createdAt: ann.createdAt
    }));

    return ok(res, { items: result });
  } catch (err) {
    console.error("listAnnouncements error:", err);
    return fail(res, "Server error", 500);
  }
};

export const markRead = async (req, res) => {
  try {
    const customerId = req.customer && req.customer.id;
    const { id } = req.body;

    if (!customerId) {
      return fail(res, "Unauthorized", 401);
    }

    if (!id) {
      return fail(res, "Announcement ID required", 400);
    }

    // Check if announcement exists and is for this customer
    const announcement = await Announcement.findOne({
      _id: id,
      active: true,
      $or: [
        { target: "all_customers" },
        { target: "specific_customer", customerId }
      ]
    });

    if (!announcement) {
      return fail(res, "Announcement not found", 404);
    }

    // Mark as read
    await AnnouncementRead.findOneAndUpdate(
      {
        announcementId: id,
        userType: "customer",
        userId: customerId
      },
      {},
      { upsert: true, new: true }
    );

    return ok(res, { success: true });
  } catch (err) {
    console.error("markRead error:", err);
    return fail(res, "Server error", 500);
  }
};