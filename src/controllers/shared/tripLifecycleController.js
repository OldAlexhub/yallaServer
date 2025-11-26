import Customer from "../../models/Customer.js";
import CustomerDiscounts from "../../models/CustomerDiscounts.js";
import FareStructure from "../../models/FareStructure.js";
import Trip from "../../models/Trip.js";
import TripEventLog from "../../models/TripEventLog.js";
import { updateZoneSpeed } from "../../services/eta/zoneSpeedLearner.js";
import { sendMessage } from "../../services/notifications/dispatcher.js";
import { customerTemplates, driverTemplates } from "../../services/notifications/templates.js";
import { haversineKm } from "../../utils/distance.js";
import { io } from "../../utils/io.js";
import { mapToZone } from "../../utils/zoneUtil.js";

export const updateTripStatus = async (req, res) => {
  try {
    const { tripId, status } = req.body;

    const allowed = [
      "driver_en_route",
      "customer_onboard",
      "completed",
      "cancelled"
    ];

    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ error: "Trip not found" });

    trip.status = status;

    if (status === "completed") {
      trip.completedAt = new Date();
      // compute and persist final fare (apply customer discounts if available)
      try {
        // base fare value prefer stored fareEstimate, fallback to recomputing from fare structure
        let baseFare = trip.fareEstimate;
        if (baseFare === undefined || baseFare === null) {
          // try to compute using FareStructure and distance
          const fareDoc = await FareStructure.findOne();
          const defaultFare = { baseFare: 10, perKm: 4.5 };
          const fs = fareDoc ? { ...defaultFare, ...fareDoc.toObject() } : defaultFare;
          baseFare = Math.round((fs.baseFare + fs.perKm * (trip.distanceKm || 0)) * 100) / 100;
        }

        // default no discount
        let discountPercent = 0;
        // fetch customer and applicable discounts
        const customer = await Customer.findById(trip.customerId);
        const discountsDoc = await CustomerDiscounts.findOne();
        if (customer && discountsDoc) {
          const tier = customer.loyalty?.tier || 'regular';
          if (tier === 'founder') discountPercent = discountsDoc.founderDiscountPercentage || 0;
          else discountPercent = discountsDoc.regularDiscountPercentage || 0;
        }

        const discountAmount = Math.round((baseFare * (discountPercent / 100)) * 100) / 100;
        const finalFare = Math.round((Math.max(0, baseFare - discountAmount)) * 100) / 100;

        // persist if not already present or out of sync
        trip.fare = finalFare;
        trip.discountPercent = discountPercent;
        trip.discountAmount = discountAmount;
      } catch (err) {
        console.error('Failed to compute/store final fare for completed trip', err);
      }

      // log completion event
      try {
        const zoneId = trip.pickup ? mapToZone(trip.pickup.lat, trip.pickup.lng) : null;
        await TripEventLog.create({
          event: "completed",
          customerId: trip.customerId,
          driverId: trip.driverId,
          pickup: trip.pickup || null,
          dropoff: trip.dropoff || null,
          zoneId
        });
      } catch (err) {
        console.error("TripEventLog completion error:", err);
      }
      // update zone speed learner
      try {
        // compute actual minutes
        let actualMinutes = trip.durationMin;
        if (!actualMinutes && trip.startedAt && trip.completedAt) {
          actualMinutes = (new Date(trip.completedAt).getTime() - new Date(trip.startedAt).getTime()) / 60000;
        }
        const distanceKm = trip.distanceKm || (trip.pickup && trip.dropoff ? haversineKm(trip.pickup.lat, trip.pickup.lng, trip.dropoff.lat, trip.dropoff.lng) : 0);
        const zoneId = trip.pickup ? mapToZone(trip.pickup.lat, trip.pickup.lng) : null;
        if (zoneId && actualMinutes && distanceKm) {
          await updateZoneSpeed(zoneId, actualMinutes, distanceKm);
        }
      } catch (err) {
        console.error("updateZoneSpeed error:", err);
      }
    }
    if (status === "cancelled") {
      try {
        const zoneId = trip.pickup ? mapToZone(trip.pickup.lat, trip.pickup.lng) : null;
        await TripEventLog.create({
          event: "cancelled",
          customerId: trip.customerId,
          driverId: trip.driverId,
          pickup: trip.pickup || null,
          dropoff: trip.dropoff || null,
          zoneId
        });
      } catch (err) {
        console.error("TripEventLog cancelled error:", err);
      }
    }

    await trip.save();
    // notify namespaces via dispatcher
    try {
      sendMessage(io, { type: 'customer', id: String(trip.customerId) }, {
        type: 'trip', title: 'Trip Status', message: `Status: ${status}`, category: 'customer', timestamp: Date.now(), data: { tripId, status }
      });
      sendMessage(io, { type: 'all_drivers' }, {
        type: 'trip', title: 'Trip Status', message: `Status: ${status}`, category: 'driver', timestamp: Date.now(), data: { tripId, status }
      });

      if (status === 'completed') {
        // send completion notifications
        const fare = trip.fare || trip.fareEstimate || 0;
        const cust = customerTemplates.tripCompleted(fare);
        sendMessage(io, { type: 'customer', id: String(trip.customerId) }, cust);
        const drv = driverTemplates.tripCompletedSummary(tripId, fare);
        sendMessage(io, { type: 'driver', id: String(trip.driverId) }, drv);
      }

      if (status === 'cancelled') {
        // inform both parties
        const cust = customerTemplates.tripCanceledByDriver();
        const drv = driverTemplates.tripCanceledByCustomer();
        sendMessage(io, { type: 'customer', id: String(trip.customerId) }, cust);
        if (trip.driverId) sendMessage(io, { type: 'driver', id: String(trip.driverId) }, drv);
      }
    } catch (err) {
      console.error('notification dispatch error', err);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("updateTripStatus error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
