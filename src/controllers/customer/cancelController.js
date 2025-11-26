import Customer from "../../models/Customer.js";
import Trip from "../../models/Trip.js";
import TripEventLog from "../../models/TripEventLog.js";
import { behaviorCheckCustomer } from "../../services/fraud/fraudBehaviorService.js";
import { applyCustomerPenalty, recordPenalty } from "../../services/penalty/penaltyEngine.js";
import { mapToZone } from "../../utils/zoneUtil.js";

export const customerCancelTrip = async (req, res) => {
  try {
    const customerId = req.customer && req.customer.id;
    const { tripId, reason } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ error: "Trip not found" });

    trip.status = "cancelled";
    trip.cancelReason = reason || "customer_cancelled";
    await trip.save();

      // log cancelled event
      try {
        const zoneId = trip.pickup && trip.pickup.lat && trip.pickup.lng ? mapToZone(trip.pickup.lat, trip.pickup.lng) : null;
        await TripEventLog.create({
          event: "cancelled",
          customerId: customerId || trip.customerId,
          driverId: trip.driverId || null,
          pickup: trip.pickup || null,
          dropoff: trip.dropoff || null,
          zoneId
        });
      } catch (err) {
        console.error("TripEventLog cancel create error:", err);
      }

    await recordPenalty({
      userType: "customer",
      userId: customerId || trip.customerId,
      tripId,
      actionType: "cancel",
      reason
    });

    const penalty = await applyCustomerPenalty(customerId || trip.customerId);

    // run behavior check and potentially flag device
    try {
      const cust = await Customer.findById(customerId || trip.customerId);
      if (cust) await behaviorCheckCustomer(cust, req.deviceId);
    } catch (err) {
      console.error("behaviorCheckCustomer error:", err);
    }

    res.json({ success: true, penaltyApplied: penalty || null });
  } catch (err) {
    console.error("customerCancelTrip error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export default customerCancelTrip;
