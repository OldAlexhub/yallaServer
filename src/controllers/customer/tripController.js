import Customer from "../../models/Customer.js";
import CustomerDiscounts from "../../models/CustomerDiscounts.js";
import Geofence from "../../models/Geofence.js";
import Trip from "../../models/Trip.js";
import TripEventLog from "../../models/TripEventLog.js";
import { estimateTravelTime } from "../../services/eta/etaEngine.js";
import { sendMessage } from "../../services/notifications/dispatcher.js";
import { customerTemplates } from "../../services/notifications/templates.js";
import { fail, ok } from "../../utils/apiResponse.js";
import { pointInPolygon } from "../../utils/geoPointInPolygon.js";
import { io } from "../../utils/io.js";
import { isPositiveNumber } from "../../utils/validators.js";
import { mapToZone } from "../../utils/zoneUtil.js";

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

const getFareStructure = async () => {
  try {
    const FareStructure = (await import("../../models/FareStructure.js")).default;
    const fareDoc = await FareStructure.findOne();
    const defaultFare = {
      baseFare: 10,
      perKm: 4.5,
      minimumFare: 5,
      waitingFare: 0.5
    };
    return fareDoc ? { ...defaultFare, ...fareDoc.toObject() } : defaultFare;
  } catch (err) {
    console.error("getFareStructure error:", err);
    return {
      baseFare: 10,
      perKm: 4.5,
      minimumFare: 5,
      waitingFare: 0.5
    };
  }
};

export const requestTrip = async (req, res) => {
  try {
    const customerId = req.customer && req.customer.id;
    const { pickup, dropoff, scheduledAt } = req.body;

    if (!pickup || !dropoff) {
      return fail(res, "pickup and dropoff are required", 400);
    }

    // Check if customer is banned
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return fail(res, "Customer not found", 404);
    }
    console.log('Customer ban check:', customer.banned, customer.loyalty?.tier);
    // defensive checks: explicit banned flag or loyalty 'banned' tier
    if (customer.banned || customer.loyalty?.tier === "banned") {
      // Send banned event via socket and return structured error
      try {
        const ioLocal = (await import("../utils/io.js")).io;
        ioLocal.of("/customer").to(String(customerId)).emit("customer:banned", {
          message: customer.banReason || "Your account has been banned.",
          code: 'PERMANENT_BANNED'
        });
      } catch (e) {
        console.warn('Failed to emit customer:banned socket event', e);
      }

      return fail(res, "Account banned", 403, { code: 'PERMANENT_BANNED' });
    }

    // check temporary penalty blocks (e.g. multiple cancels leading to a temporary block)
    const blockedUntil = customer.penalties?.blockedUntil ? new Date(customer.penalties.blockedUntil) : null;
    console.log('Customer penalty check - blockedUntil:', blockedUntil);
    if (blockedUntil && blockedUntil > new Date()) {
      // notify customer socket that they are temporarily blocked and return structured response
      try {
        const ioLocal = (await import("../utils/io.js")).io;
        ioLocal.of("/customer").to(String(customerId)).emit("customer:blocked", {
          message: `Account temporarily blocked until ${blockedUntil.toISOString()}`,
          blockedUntil: blockedUntil.toISOString(),
          code: 'TEMP_BLOCKED'
        });
      } catch (e) {
        console.warn('Failed to emit customer:blocked socket event', e);
      }

      // give a clear message differentiating temporary blocks vs permanent bans
      return fail(res, `Account temporarily blocked until ${blockedUntil.toISOString()}`, 403, {
        code: 'TEMP_BLOCKED',
        blockedUntil: blockedUntil.toISOString()
      });
    }
    // clear expired block timestamps automatically so users don't get stuck
    if (blockedUntil && blockedUntil <= new Date()) {
      console.log('Clearing expired blockedUntil for customer', customerId);
      customer.penalties.blockedUntil = null;
      await customer.save();
    }

    // basic coordinate validation
    if (
      !isPositiveNumber(pickup.lat) ||
      !isPositiveNumber(pickup.lng) ||
      !isPositiveNumber(dropoff.lat) ||
      !isPositiveNumber(dropoff.lng)
    ) {
      return fail(res, "Invalid coordinates", 400);
    }

    // geofence check
    const areas = await Geofence.find({ active: true });
    console.log('Geofence count:', (areas && areas.length) || 0, 'pickup:', pickup);
    let allowed = false;
    for (const area of areas) {
      if (pointInPolygon(pickup.lat, pickup.lng, area.polygon)) allowed = true;
    }
    if (!allowed) {
      console.log('Pickup outside service area — rejecting trip');
      // return 409 with a geofence reason so clients can show a geofence-specific UI
      return res.status(409).json({ error: "Outside service area", reason: 'geofence' });
    }

    const distanceKm = calcDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);

    // sanity cap
    if (distanceKm <= 0 || distanceKm > 200) {
      return fail(res, "Unreasonable trip distance", 400);
    }

    const fareStructure = await getFareStructure();
    const fareEstimate = Math.round((fareStructure.baseFare + fareStructure.perKm * distanceKm) * 100) / 100;

    // If this is a scheduled trip (future), we should not try to assign a driver now.
    let nearest = null;
    let isScheduled = false;
    let scheduledTime = null;
    if (scheduledAt) {
      scheduledTime = new Date(scheduledAt);
      if (isNaN(scheduledTime.getTime())) {
        return fail(res, 'Invalid scheduledAt value', 400);
      }
      const now = new Date();
      if (scheduledTime <= now) {
        return fail(res, 'scheduledAt must be a future time', 400);
      }
      isScheduled = true;
    }

    // We'll delegate assignment to the assignment engine which supports single-driver offers, retries and broadcast

    const trip = new Trip({
      customerId,
      pickup,
      dropoff,
      fareEstimate,
      distanceKm,
      status: isScheduled ? 'scheduled' : 'requested',
      scheduledAt: isScheduled ? scheduledTime : null,
    });

    // compute and persist discount metadata and final fare at creation time
    try {
      const discountsDoc = await CustomerDiscounts.findOne();
      let discountPercent = 0;
      if (customer && discountsDoc) {
        const tier = customer.loyalty?.tier || (customer.founder ? 'founder' : 'regular');
        if (tier === 'founder') discountPercent = discountsDoc.founderDiscountPercentage || 0;
        else discountPercent = discountsDoc.regularDiscountPercentage || 0;
      }

      const discountAmount = Math.round((fareEstimate * (discountPercent / 100)) * 100) / 100;
      const finalFare = Math.round((Math.max(0, fareEstimate - discountAmount)) * 100) / 100;

      trip.discountPercent = discountPercent;
      trip.discountAmount = discountAmount;
      trip.fare = finalFare;
    } catch (err) {
      console.error('Failed to compute discounts at trip creation', err);
    }

    // Save trip first before attempting assignment

    // estimate dropoff ETA using current zone heat map if available
    // For scheduled trips we skip ETA calculation and driver notifications
    if (!isScheduled) {
    try {
      const dropoffETA = await estimateTravelTime(
        { lat: pickup.lat, lng: pickup.lng },
        { lat: dropoff.lat, lng: dropoff.lng },
        global.zoneHeatMap || {}
      );
      trip.etaDropoffMinutes = dropoffETA.etaMinutes;
    } catch (err) {
      // ignore ETA failures
      console.error("dropoff ETA error:", err);
    }
    }

    await trip.save();

    // For immediate trips delegate assignment to assignment engine (non-blocking but we wait briefly to report assigned state)
    if (!isScheduled) {
      try {
        const { default: assignmentEngine } = await import('../../services/dispatch/assignmentEngine.js');
        const assignedTrip = await assignmentEngine.tryAssignInitialDriver(trip._id, io);
        if (assignedTrip && assignedTrip.driverId) {
          trip.driverId = assignedTrip.driverId;
          trip.status = assignedTrip.status;
        }
      } catch (err) {
        console.warn('assignment engine initial assign error:', err);
      }
    }

    // log event for AI/demand engine
    try {
      const zoneId = mapToZone(pickup.lat, pickup.lng);
      await TripEventLog.create({
        event: "requested",
        customerId,
        driverId: trip.driverId || null,
        pickup: { lat: pickup.lat, lng: pickup.lng },
        dropoff: { lat: dropoff.lat, lng: dropoff.lng },
        zoneId
      });
    } catch (err) {
      console.error("TripEventLog create error:", err);
    }

    // driver notification is handled by assignment engine when assigning a driver.

    // notify customer that trip requested or scheduled
    try {
      const payload = isScheduled ? customerTemplates.systemAnnouncement('Trip Scheduled', `Your trip ${String(trip._id)} is scheduled for ${scheduledTime.toLocaleString()}`) : customerTemplates.tripRequested(String(trip._id));
      sendMessage(io, { type: "customer", id: String(customerId) }, payload);
      if (trip.driverId) {
        try {
          // populate driver name if available
          const Driver = (await import('../../models/Driver.js')).default;
          const drv = await Driver.findById(trip.driverId).select('name');
          const driverName = drv?.name || 'Driver';
          const assignedPayload = customerTemplates.driverAssigned(driverName, trip.etaDropoffMinutes || 0);
          sendMessage(io, { type: 'customer', id: String(customerId) }, assignedPayload);
        } catch (err) {
          // ignore notification failures
        }
      }
    } catch (err) {
      console.error('notify customer error', err);
    }

    return ok(res, {
      tripId: trip._id,
      assigned: Boolean(trip.driverId),
      fareEstimate,
      fare: trip.fare,
      discountPercent: trip.discountPercent,
      discountAmount: trip.discountAmount,
      distanceKm,
      etaDropoffMinutes: trip.etaDropoffMinutes || null,
      scheduledAt: trip.scheduledAt || null,
      pickup,
      dropoff,
    });
  } catch (err) {
    console.error("requestTrip error:", err);
    return fail(res, "Server error", 500);
  }
};

export const getTripHistory = async (req, res) => {
  try {
    const customerId = req.customer && req.customer.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const trips = await Trip.find({ customerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('driverId', 'name phone')
      .select('pickup dropoff fareEstimate fare discountPercent discountAmount distanceKm status createdAt');

    const total = await Trip.countDocuments({ customerId });

    return ok(res, {
      trips,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("getTripHistory error:", err);
    return fail(res, "Server error", 500);
  }
};

export const getEstimate = async (req, res) => {
  try {
    console.log('getEstimate called', req.customer, req.body);
    const customerId = req.customer && req.customer.id;
    const { pickup, dropoff } = req.body;

    if (!pickup || !dropoff) {
      return fail(res, "pickup and dropoff are required", 400);
    }

    // basic coordinate validation
    if (
      !isPositiveNumber(pickup.lat) ||
      !isPositiveNumber(pickup.lng) ||
      !isPositiveNumber(dropoff.lat) ||
      !isPositiveNumber(dropoff.lng)
    ) {
      return fail(res, "Invalid coordinates", 400);
    }

    const distanceKm = calcDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);

    // sanity cap
    if (distanceKm <= 0 || distanceKm > 200) {
      return fail(res, "Unreasonable trip distance", 400);
    }

    const fareStructure = await getFareStructure();
    const total = Math.round((fareStructure.baseFare + fareStructure.perKm * distanceKm) * 100) / 100;

    // estimate dropoff ETA using current zone heat map if available
    let etaMinutes = null;
    try {
      const dropoffETA = await estimateTravelTime(
        { lat: pickup.lat, lng: pickup.lng },
        { lat: dropoff.lat, lng: dropoff.lng },
        global.zoneHeatMap || {}
      );
      etaMinutes = dropoffETA.etaMinutes;
    } catch (err) {
      // ignore ETA failures
      console.error("dropoff ETA error:", err);
    }

    return ok(res, {
      total,
      distanceKm,
      etaMinutes,
      baseFare: fareStructure.baseFare,
      perKm: fareStructure.perKm,
    });
  } catch (err) {
    console.error("getEstimate error:", err);
    return fail(res, "Server error", 500);
  }
};
