import Driver from "../../models/Driver.js";
import Trip from "../../models/Trip.js";
import TripEventLog from "../../models/TripEventLog.js";
import { behaviorCheckDriver } from "../../services/fraud/fraudBehaviorService.js";
import { applyDriverPenalty, recordPenalty } from "../../services/penalty/penaltyEngine.js";
import { mapToZone } from "../../utils/zoneUtil.js";

export const driverCancelTrip = async (req, res) => {
  try {
    const driverId = req.driver && req.driver.id;
    const { tripId, reason } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ error: "Trip not found" });

    trip.status = "cancelled";
    trip.cancelReason = reason || "driver_cancelled";
    await trip.save();

    await recordPenalty({
      userType: "driver",
      userId: driverId || trip.driverId,
      tripId,
      actionType: "ignored_trip",
      reason
    });

    const penalty = await applyDriverPenalty(driverId || trip.driverId);

    // behavior check for driver abuse
    try {
      const drv = await Driver.findById(driverId || trip.driverId);
      if (drv) await behaviorCheckDriver(drv, req.deviceId);
    } catch (err) {
      console.error("behaviorCheckDriver error:", err);
    }

    // log cancelled event
    try {
      const zoneId = trip.pickup && trip.pickup.lat && trip.pickup.lng ? mapToZone(trip.pickup.lat, trip.pickup.lng) : null;
      await TripEventLog.create({
        event: "cancelled",
        customerId: trip.customerId || null,
        driverId: driverId || trip.driverId || null,
        pickup: trip.pickup || null,
        dropoff: trip.dropoff || null,
        zoneId
      });
    } catch (err) {
      console.error("TripEventLog driver cancel error:", err);
    }

    res.json({ success: true, penaltyApplied: penalty || null });
  } catch (err) {
    console.error("driverCancelTrip error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export default driverCancelTrip;
