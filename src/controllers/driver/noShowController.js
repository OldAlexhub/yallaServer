import FraudDevice from "../../models/FraudDevice.js";
import Trip from "../../models/Trip.js";
import TripEventLog from "../../models/TripEventLog.js";
import { behaviorCheckCustomer } from "../../services/fraud/fraudBehaviorService.js";
import { sendMessage } from "../../services/notifications/dispatcher.js";
import { customerTemplates, driverTemplates } from "../../services/notifications/templates.js";
import { applyCustomerPenalty, recordPenalty } from "../../services/penalty/penaltyEngine.js";
import { mapToZone } from "../../utils/zoneUtil.js";

export const markNoShow = async (req, res) => {
  try {
    const { tripId } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ error: "Trip not found" });

    trip.status = "cancelled";
    trip.cancelReason = "customer_no_show";
    await trip.save();

    await recordPenalty({
      userType: "customer",
      userId: trip.customerId,
      tripId,
      actionType: "no_show",
      reason: "driver_marked_no_show"
    });

    const penalty = await applyCustomerPenalty(trip.customerId);

    // try to find the customer's device and run behavior checks
    try {
      const f = await FraudDevice.findOne({ customerId: trip.customerId }).sort({ updatedAt: -1 });
      if (f && f.deviceId) {
        await behaviorCheckCustomer({ penalties: { cancelCount7Days: 0, noShowCount7Days: 0 } }, f.deviceId);
      }
    } catch (err) {
      console.error("markNoShow behavior check error:", err);
    }

    // log no-show event for AI engine
    try {
      const zoneId = trip.pickup && trip.pickup.lat && trip.pickup.lng ? mapToZone(trip.pickup.lat, trip.pickup.lng) : null;
      await TripEventLog.create({
        event: "no-show",
        customerId: trip.customerId,
        driverId: trip.driverId || null,
        pickup: trip.pickup || null,
        dropoff: trip.dropoff || null,
        zoneId
      });
    } catch (err) {
      console.error("TripEventLog no-show error:", err);
    }

    // notify customer and driver
    try {
      const custMsg = customerTemplates.noShowWarning();
      sendMessage(req.io, { type: 'customer', id: String(trip.customerId) }, custMsg);
      if (trip.driverId) {
        const drvMsg = driverTemplates.tripCanceledByCustomer();
        sendMessage(req.io, { type: 'driver', id: String(trip.driverId) }, drvMsg);
      }
    } catch (err) {
      console.error('no-show notification error', err);
    }

    res.json({ success: true, penalty });
  } catch (err) {
    console.error("markNoShow error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export default markNoShow;
