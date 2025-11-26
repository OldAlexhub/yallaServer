import AssignmentLog from '../../models/AssignmentLog.js';
import MatchingConfig from '../../models/MatchingConfig.js';
import Trip from '../../models/Trip.js';
import { findDriversWithinRadius } from './matchingEngine.js';
import { getAllOnlineDrivers } from './onlineDriversRegistry.js';

const DEFAULT_OFFER_WINDOW_MS = 15 * 1000; // 15s offer window

async function getMatchingConfig() {
  try {
    const cfg = await MatchingConfig.findOne();
    if (cfg) return cfg.toObject();
  } catch (err) {
    console.warn('Could not load MatchingConfig', err);
  }
  return { assignmentRadius: 5000, maxRetries: 3, etaMultiplier: 1.5, cooldownTime: 60 };
}

export async function assignToDriver(trip, driverCandidate, io, offerWindowMs = DEFAULT_OFFER_WINDOW_MS) {
  if (!trip || !driverCandidate) return null;

  try {
    trip.driverId = driverCandidate.driverId;
    trip.status = 'driver_assigned';
    trip.assignmentAttempts = (trip.assignmentAttempts || 0) + 1;
    trip.attemptedDriverIds = (trip.attemptedDriverIds || []).map(String);
    if (!trip.attemptedDriverIds.includes(String(driverCandidate.driverId))) {
      trip.attemptedDriverIds.push(String(driverCandidate.driverId));
    }
    trip.offerExpiresAt = new Date(Date.now() + offerWindowMs);
    await trip.save();

    // Log the offer attempt
    try {
      await AssignmentLog.create({
        tripId: trip._id,
        driverId: driverCandidate.driverId,
        action: 'offer',
        attemptNumber: trip.assignmentAttempts || 0,
        socketId: driverCandidate.socketId || null,
        distanceKm: driverCandidate.dist || null
      });
    } catch (err) {
      console.warn('assignment log create failed (offer)', err);
    }

    // emit single-driver offer
    try {
      if (driverCandidate.socketId) {
        io.of('/driver').to(String(driverCandidate.socketId)).emit('trip:new_request', {
          tripId: trip._id,
          pickup: trip.pickup,
          dropoff: trip.dropoff,
          fareEstimate: trip.fareEstimate,
          fare: trip.fare,
          discountPercent: trip.discountPercent,
          discountAmount: trip.discountAmount,
          distanceKm: trip.distanceKm,
          offerExpiresAt: trip.offerExpiresAt ? trip.offerExpiresAt.toISOString() : null,
          attemptNumber: trip.assignmentAttempts || 0
        });
      }
    } catch (err) {
      console.warn('Failed to send single-driver offer', err);
    }

    return trip;
  } catch (err) {
    console.error('assignToDriver error', err);
    return null;
  }
}

import Driver from '../../models/Driver.js';

export async function tryAssignInitialDriver(tripId, io) {
  const trip = await Trip.findById(tripId);
  if (!trip) return null;
  if (trip.status !== 'requested' && trip.status !== 'scheduled') return trip;

  const cfg = await getMatchingConfig();
  const radiusKm = (cfg.assignmentRadius || 5000) / 1000;

  let candidates = await findDriversWithinRadius(trip.pickup.lat, trip.pickup.lng, radiusKm);
  if (!candidates || candidates.length === 0) return trip;

  // filter out drivers who are in attempted list or in penalty cooldown
  const attempted = (trip.attemptedDriverIds || []).map(String);
  // fetch driver records to check penalties
  const driverIds = candidates.map(c => c.driverId);
  const drivers = await Driver.find({ _id: { $in: driverIds } }).select('penalty');
  const now = new Date();
  candidates = candidates.filter(c => {
    const sid = String(c.driverId);
    if (attempted.includes(sid)) return false;
    const drv = drivers.find(d => String(d._id) === sid);
    if (drv && drv.penalty && drv.penalty.active && drv.penalty.expiresAt && drv.penalty.expiresAt > now) return false;
    return true;
  });

  if (candidates.length === 0) return trip;

  // pick closest candidate
  const candidate = candidates[0];
  return assignToDriver(trip, candidate, io);
}

export async function processAssignmentTimeouts(io) {
  try {
    const now = new Date();
    const cfg = await getMatchingConfig();
    const maxRetries = cfg.maxRetries || 3;
    const radiusKm = (cfg.assignmentRadius || 5000) / 1000;

    // Find driver_assigned trips where offerExpiresAt is in the past
    const due = await Trip.find({ status: 'driver_assigned', offerExpiresAt: { $lte: now } });

    for (const trip of due) {
      // If the driver has accepted the trip and status changed, skip
      if (trip.status !== 'driver_assigned') continue;

      if ((trip.assignmentAttempts || 0) < maxRetries) {
        // pick next candidate excluding attempted drivers
        let candidates = await findDriversWithinRadius(trip.pickup.lat, trip.pickup.lng, radiusKm);
        const attempted = (trip.attemptedDriverIds || []).map(String);
        // filter out attempted and penalized drivers
        const driverIds = candidates.map(c => c.driverId);
        const drivers = await Driver.find({ _id: { $in: driverIds } }).select('penalty');
        const now = new Date();
        candidates = candidates.filter(c => {
          const sid = String(c.driverId);
          if (attempted.includes(sid)) return false;
          const drv = drivers.find(d => String(d._id) === sid);
          if (drv && drv.penalty && drv.penalty.active && drv.penalty.expiresAt && drv.penalty.expiresAt > now) return false;
          return true;
        });
        const next = candidates.find(c => !attempted.includes(String(c.driverId)));
        if (next) {
          // log reoffer attempt
          try {
            await AssignmentLog.create({ tripId: trip._id, driverId: next.driverId, action: 'reoffer', attemptNumber: (trip.assignmentAttempts || 0) + 1, socketId: next.socketId || null, distanceKm: next.dist || null });
          } catch (err) {
            console.warn('assignment log create failed (reoffer)', err);
          }

          await assignToDriver(trip, next, io);
          console.log(`Re-offered trip ${trip._id} to next driver ${next.driverId}`);
          continue;
        }
      }

      // max retries reached or no next candidate: broadcast to all available drivers
      if (!trip.broadcasted) {
        try {
          const candidates = await findDriversWithinRadius(trip.pickup.lat, trip.pickup.lng, radiusKm);
          const online = getAllOnlineDrivers();
          const driverSockets = candidates.map(c => c.socketId).filter(Boolean);
          // send a broadcast event to driver sockets (if configured) - clients should handle broadcast accept
          for (const sock of driverSockets) {
            io.of('/driver').to(String(sock)).emit('trip:broadcast_request', {
              tripId: trip._id,
              pickup: trip.pickup,
              dropoff: trip.dropoff,
              fareEstimate: trip.fareEstimate,
              fare: trip.fare,
              discountPercent: trip.discountPercent,
              discountAmount: trip.discountAmount,
              distanceKm: trip.distanceKm,
              offerExpiresAt: trip.offerExpiresAt ? trip.offerExpiresAt.toISOString() : null,
              attemptNumber: trip.assignmentAttempts || 0
            });
          }

            // log broadcast event
            try {
              await AssignmentLog.create({ tripId: trip._id, action: 'broadcast', attemptNumber: trip.assignmentAttempts || 0, notes: `broadcastedTo=${driverSockets.length}` });
            } catch (err) {
              console.warn('assignment log create failed (broadcast)', err);
            }

            trip.broadcasted = true;
          trip.status = 'requested'; // let drivers accept via /driver/accept (first to accept wins)
          trip.offerExpiresAt = null;
          await trip.save();
          console.log(`Broadcasted trip ${trip._id} to ${driverSockets.length} drivers`);
        } catch (err) {
          console.warn('broadcast attempt failed', err);
        }
      }
    }
  } catch (err) {
    console.error('processAssignmentTimeouts error', err);
  }
}

export function startAssignmentProcessor(io, intervalMs = 5000) {
  // run processing periodically
  setInterval(() => {
    processAssignmentTimeouts(io).catch((err) => console.error('assignment processor error', err));
  }, intervalMs);
}

export default { assignToDriver, tryAssignInitialDriver, processAssignmentTimeouts, startAssignmentProcessor };
