import AssignmentLog from "../../models/AssignmentLog.js";
import Trip from "../../models/Trip.js";
import { sendMessage } from "../../services/notifications/dispatcher.js";
import { customerTemplates, driverTemplates } from "../../services/notifications/templates.js";
import { fail, ok } from "../../utils/apiResponse.js";
import { io } from "../../utils/io.js";

export const acceptTrip = async (req, res) => {
  try {
    const driverId = req.driver.id;
    const { tripId } = req.body;

    // Use an atomic update to ensure only the first accepting driver wins
    let updated = await Trip.findOneAndUpdate(
      { _id: tripId, $or: [ { driverId: null }, { driverId: driverId } ] },
      { $set: { driverId: driverId, status: "driver_en_route" } },
      { new: true }
    );

    if (!updated) {
      // Check if the trip exists and was assigned to another driver
      const existing = await Trip.findById(tripId);
      if (!existing) return fail(res, "Trip not found", 404);
      if (existing.driverId && String(existing.driverId) !== String(driverId)) {
        return fail(res, "Driver not assigned to this trip", 403);
      }
      // fallback: if we couldn't update for some reason, return server error
      return fail(res, "Could not accept trip at this time", 500);
    }

    // record accepted log
    try {
      await AssignmentLog.create({ tripId: updated._id, driverId: driverId, action: 'accepted', attemptNumber: updated.assignmentAttempts || 0 });
    } catch (err) {
      console.warn('Failed to log assignment accepted', err);
    }

    // notify customer via dispatcher
    try {
      const driverName = req.driver.name || 'Driver';
      // send confirmation to customer
      const customerPayload = customerTemplates.driverAssigned(driverName, updated.etaDropoffMinutes || 0);
      sendMessage(io, { type: 'customer', id: String(updated.customerId) }, customerPayload);

      // notify driver with tripAssigned
      const pickupAddress = updated.pickup && updated.pickup.address ? updated.pickup.address : 'pickup location';
      const driverPayload = driverTemplates.tripAssigned(tripId, pickupAddress, updated.etaDropoffMinutes || 0);
      sendMessage(io, { type: 'driver', id: String(driverId) }, driverPayload);
      // also emit driver namespace event to this socket room
      try {
        io.of('/driver').to(String(driverId)).emit('trip:assigned', { tripId, pickup: updated.pickup, dropoff: updated.dropoff, fare: updated.fare, fareEstimate: updated.fareEstimate });
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.error('notify on accept error', err);
    }

    return ok(res, { status: trip.status });
  } catch (err) {
    console.error("acceptTrip error:", err);
    return fail(res, "Server error", 500);
  }
};

export const rejectTrip = async (req, res) => {
  try {
    const driverId = req.driver.id;
    const { tripId, reason } = req.body;

    if (!tripId) return fail(res, "Trip ID is required", 400);

    const trip = await Trip.findById(tripId);
    if (!trip) return fail(res, "Trip not found", 404);
    if (trip.driverId && String(trip.driverId) !== String(driverId)) {
      return fail(res, "Driver not assigned to this trip", 403);
    }

    const previousStatus = trip.status;
    trip.driverId = null;
    trip.cancelReason = reason || "Driver rejected the assignment";
    trip.status = ["driver_en_route", "customer_onboard"].includes(trip.status) ? "cancelled" : "requested";
    await trip.save();

    // log rejection for this driver so engine can retry
    try {
      await AssignmentLog.create({ tripId: trip._id, driverId: driverId, action: 'rejected', attemptNumber: trip.assignmentAttempts || 0 });
    } catch (err) {
      console.warn('Failed to log assignment rejection', err);
    }

    // If this results in a 'requested' trip, trigger assignment engine to attempt next candidate immediately
    if (trip.status === 'requested') {
      try {
        const { default: assignmentEngine } = await import('../../services/dispatch/assignmentEngine.js');
        await assignmentEngine.tryAssignInitialDriver(trip._id, io);
      } catch (err) {
        console.warn('assignment retry after driver rejection failed', err);
      }
    }

    try {
      sendMessage(io, { type: "customer", id: String(trip.customerId) }, customerTemplates.tripCanceledByDriver());
      sendMessage(io, { type: "driver", id: String(driverId) }, {
        type: "alert",
        title: "Trip Rejected",
        message: `You rejected trip ${tripId}. The dispatcher will reassign it shortly.`,
        category: "driver",
        timestamp: Date.now(),
        data: { tripId }
      });
    } catch (err) {
      console.error("notification on reject error", err);
    }

    return ok(res, { status: trip.status });
  } catch (err) {
    console.error("rejectTrip error:", err);
    return fail(res, "Server error", 500);
  }
};

export const arrivedTrip = async (req, res) => {
  try {
    const driverId = req.driver.id;
    const { tripId } = req.body;
    if (!tripId) return fail(res, 'Trip ID is required', 400);

    const trip = await Trip.findById(tripId);
    if (!trip) return fail(res, 'Trip not found', 404);
    if (String(trip.driverId) !== String(driverId)) return fail(res, 'Driver not assigned to this trip', 403);

    // notify customer driver is nearby
    try {
      sendMessage(io, { type: 'customer', id: String(trip.customerId) }, customerTemplates.driverNearby());
      // driver-side notification
      sendMessage(io, { type: 'driver', id: String(driverId) }, { type: 'popup', title: 'Marked arrived', message: 'You marked arrival at pickup', category: 'driver', timestamp: Date.now(), data: { tripId } });
    } catch (err) {
      console.error('arrived notify error', err);
    }

    return ok(res, { ok: true });
  } catch (err) {
    console.error('arrivedTrip error', err);
    return fail(res, 'Server error', 500);
  }
};

export const startTrip = async (req, res) => {
  try {
    const driverId = req.driver.id;
    const { tripId } = req.body;
    if (!tripId) return fail(res, 'Trip ID is required', 400);

    let trip = await Trip.findById(tripId);
    if (!trip) return fail(res, 'Trip not found', 404);
    if (String(trip.driverId) !== String(driverId)) return fail(res, 'Driver not assigned to this trip', 403);

    trip.status = 'customer_onboard';
    trip.startedAt = new Date();
    await trip.save();

    // notify customer
    try {
      sendMessage(io, { type: 'customer', id: String(trip.customerId) }, customerTemplates.tripStarted());
      sendMessage(io, { type: 'driver', id: String(driverId) }, { type: 'popup', title: 'Trip started', message: 'Trip started. Drive safely.', category: 'driver', timestamp: Date.now(), data: { tripId } });
    } catch (err) {
      console.error('start notify error', err);
    }

    return ok(res, { status: trip.status, startedAt: trip.startedAt });
  } catch (err) {
    console.error('startTrip error', err);
    return fail(res, 'Server error', 500);
  }
};

export const completeTrip = async (req, res) => {
  try {
    const driverId = req.driver.id;
    const { tripId, fare, distanceKm, durationMin } = req.body || {};
    if (!tripId) return fail(res, 'Trip ID is required', 400);

    const trip = await Trip.findById(tripId);
    if (!trip) return fail(res, 'Trip not found', 404);
    if (String(trip.driverId) !== String(driverId)) return fail(res, 'Driver not assigned to this trip', 403);

    trip.status = 'completed';
    trip.completedAt = new Date();
    if (fare) trip.fare = fare;
    if (distanceKm) trip.distanceKm = distanceKm;
    if (durationMin) trip.durationMin = durationMin;
    await trip.save();

    try {
      sendMessage(io, { type: 'customer', id: String(trip.customerId) }, customerTemplates.tripCompleted(trip.fare || fare || 0));
      sendMessage(io, { type: 'driver', id: String(driverId) }, driverTemplates.tripCompletedSummary ? driverTemplates.tripCompletedSummary(tripId, trip.fare || fare || 0) : { type: 'popup', title: 'Trip completed', message: `Trip ${tripId} completed` });
    } catch (err) {
      console.error('complete notify error', err);
    }

    return ok(res, { status: trip.status, completedAt: trip.completedAt, fare: trip.fare });
  } catch (err) {
    console.error('completeTrip error', err);
    return fail(res, 'Server error', 500);
  }
};
