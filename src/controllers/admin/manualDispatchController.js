import Customer from "../../models/Customer.js";
import Driver from "../../models/Driver.js";
import Geofence from "../../models/Geofence.js";
import Trip from "../../models/Trip.js";
import { pointInPolygon } from "../../utils/geoPointInPolygon.js";
import { io } from "../../utils/io.js";

// simple haversine
const calcDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

export const callCenterCreateTrip = async (req, res) => {
  try {
    const { phoneNumber, pickup, dropoff } = req.body;

    if (!phoneNumber || !pickup || !dropoff) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // find or create customer
    let customer = await Customer.findOne({ phone: phoneNumber });
    if (!customer) {
      customer = await Customer.create({
        phone: phoneNumber,
        name: "Phone Customer " + phoneNumber
      });
    }

    // geofence check
    const areas = await Geofence.find({ active: true });
    let allowed = false;
    for (const area of areas) {
      if (pointInPolygon(pickup.lat, pickup.lng, area.polygon)) allowed = true;
    }
    if (!allowed) return res.status(403).json({ error: "Pickup outside service area" });

    const distanceKm = calcDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);

    const fareEstimate = Math.round((10 + distanceKm * 4.5) * 100) / 100;

    const trip = await Trip.create({
      customerId: customer._id,
      pickup,
      dropoff,
      fareEstimate,
      distanceKm,
      status: "requested"
    });

    res.json({
      success: true,
      tripId: trip._id,
      message: "Trip created. Dispatcher may now assign a driver."
    });
  } catch (err) {
    console.error("callCenterCreateTrip error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const callCenterAssignDriver = async (req, res) => {
  try {
    const { tripId, driverId } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ error: "Trip not found" });

    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ error: "Driver not found" });

    trip.driverId = driverId;
    trip.status = "driver_assigned";
    await trip.save();

    // notify driver by socketId if available
    io.of("/driver").to(String(driverId)).emit("trip:new_request", {
      tripId,
      pickup: trip.pickup,
      dropoff: trip.dropoff,
      fareEstimate: trip.fareEstimate
    });

    // notify customer
    io.of("/customer").to(String(trip.customerId)).emit("trip:driver_assigned", {
      tripId,
      driverId
    });

    res.json({ success: true, message: "Driver assigned successfully." });
  } catch (err) {
    console.error("callCenterAssignDriver error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

import { getAllOnlineDrivers } from "../../services/dispatch/onlineDriversRegistry.js";

export const callCenterFindNearbyDrivers = async (req, res) => {
  try {
    const { lat, lng, radiusKm = 5 } = req.body;

    const all = getAllOnlineDrivers();
    const results = [];

    for (const d of all) {
      if (!d.lat || !d.lng) continue;

      const R = 6371;
      const dLat = ((d.lat - lat) * Math.PI) / 180;
      const dLng = ((d.lng - lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat * Math.PI) / 180) *
          Math.cos((d.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
      const dist = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));

      if (dist <= radiusKm) {
        results.push({
          driverId: d.driverId,
          socketId: d.socketId,
          dist
        });
      }
    }

    res.json({ drivers: results.sort((a, b) => a.dist - b.dist) });
  } catch (err) {
    console.error("callCenterFindNearbyDrivers error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const callCenterReassignDriver = async (req, res) => {
  try {
    const { tripId, newDriverId } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ error: "Trip not found" });

    const driver = await Driver.findById(newDriverId);
    if (!driver) return res.status(404).json({ error: "Driver not found" });

    trip.driverId = newDriverId;
    trip.status = "driver_assigned";
    await trip.save();

    io.of("/driver").to(String(newDriverId)).emit("trip:new_request", {
      tripId,
      pickup: trip.pickup,
      dropoff: trip.dropoff,
      fareEstimate: trip.fareEstimate
    });

    res.json({ success: true, message: "Driver reassigned." });
  } catch (err) {
    console.error("callCenterReassignDriver error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const callCenterOverrideStatus = async (req, res) => {
  try {
    const { tripId, status } = req.body;

    const allowed = [
      "requested",
      "driver_assigned",
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
    await trip.save();

    io.of("/customer").emit("trip:status_update", { tripId, status });
    io.of("/driver").emit("trip:status_update", { tripId, status });

    res.json({ success: true });
  } catch (err) {
    console.error("callCenterOverrideStatus error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export default {
  callCenterCreateTrip,
  callCenterAssignDriver,
  callCenterFindNearbyDrivers,
  callCenterReassignDriver,
  callCenterOverrideStatus
};
