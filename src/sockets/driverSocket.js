import jwt from "jsonwebtoken";
import Driver from "../models/Driver.js";
import Geofence from "../models/Geofence.js";
import {
    setDriverOffline,
    setDriverOnline,
    updateDriverLocation
} from "../services/dispatch/onlineDriversRegistry.js";
import { sendMessage } from "../services/notifications/dispatcher.js"; // Ensure correct relative import path
import { customerTemplates, driverTemplates } from "../services/notifications/templates.js"; // Ensure correct relative import path
import { ensureSubscriptionValidity } from "../services/subscription/subscriptionService.js";
import { pointInPolygon } from "../utils/geoPointInPolygon.js";

const isInsideAnyActiveGeofence = async (lat, lng) => {
  const activeAreas = await Geofence.find({ active: true });
  if (!activeAreas.length) return false;

  for (const area of activeAreas) {
    if (pointInPolygon(lat, lng, area.polygon)) return true;
  }
  return false;
};

export const initDriverSocket = (io) => {
  const driverNamespace = io.of("/driver");

  driverNamespace.use(async (socket, next) => {
    try {
      const { token } = socket.handshake.auth || {};
      if (!token) return next(new Error("No token provided"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const driver = await Driver.findById(decoded.driverId);
      if (!driver) return next(new Error("Driver not found"));

      // update subscription if expired
      await ensureSubscriptionValidity(driver);

      socket.driver = {
        id: driver._id,
        phone: driver.phone
      };

      next();
    } catch (err) {
      console.error("Driver socket auth error:", err);
      next(new Error("Unauthorized"));
    }
  });

  driverNamespace.on("connection", (socket) => {
    const driverId = String(socket.driver.id);
    console.log("Driver connected:", driverId, socket.id);
    // join drivers room for zone broadcasts
    socket.join("drivers");
    // join personal room for direct messages
    socket.join(String(driverId));

    // driver requests to go online with { lat, lng }
    socket.on("driver:go_online", async (payload, cb) => {
      try {
        const { lat, lng } = payload || {};

        if (lat === undefined || lng === undefined) {
          return cb && cb({ error: "lat and lng are required" });
        }

        const driver = await Driver.findById(driverId);
        if (!driver) return cb && cb({ error: "Driver not found" });

        // Ensure subscription still valid
        await ensureSubscriptionValidity(driver);

        if (!driver.subscription.active) {
          return cb && cb({ error: "Subscription inactive. Redeem a voucher." });
        }

        if (driver.penalty && driver.penalty.active) {
          return cb && cb({ error: "You are under penalty and cannot go online." });
        }

        if (!driver.documents || driver.documents.status !== "approved") {
          return cb && cb({ error: "Documents not approved yet." });
        }

        // geofence check
        const inside = await isInsideAnyActiveGeofence(lat, lng);
        if (!inside) {
          // send geofence warning to driver
          try {
            const payload = driverTemplates.geofenceWarning();
            sendMessage(io, { type: 'driver', id: String(driverId) }, payload);
          } catch (err) {
            console.error('geofence warning send error', err);
          }
          return cb && cb({ error: "You are outside the service area." });
        }

        // mark DB
        driver.online = true;
        driver.currentLocation = { lat, lng };
        await driver.save();

        // mark in registry
        setDriverOnline(driverId, { socketId: socket.id, lat, lng });

        cb && cb({ success: true });

        // optionally notify admin namespace about online driver
      } catch (err) {
        console.error("driver:go_online error:", err);
        cb && cb({ error: "Server error" });
      }
    });

    // driver goes offline
    socket.on("driver:go_offline", async (payload, cb) => {
      try {
        const driver = await Driver.findById(driverId);
        if (driver) {
          driver.online = false;
          await driver.save();
        }
        setDriverOffline(driverId);
        cb && cb({ success: true });
      } catch (err) {
        console.error("driver:go_offline error:", err);
        cb && cb({ error: "Server error" });
      }
    });

    // driver sends location updates { lat, lng }
    socket.on("driver:location_update", async (payload, cb) => {
      try {
        const { lat, lng } = payload || {};
        if (lat === undefined || lng === undefined) {
          return cb && cb({ error: "lat and lng are required" });
        }

        // update DB minimal, registry for realtime
        await Driver.findByIdAndUpdate(driverId, {
          $set: { currentLocation: { lat, lng } }
        });

        updateDriverLocation(driverId, { lat, lng });

        // emit ETA updates to customer if driver has an active trip
        try {
          const driver = await Driver.findById(driverId);
          const Trip = (await import("../models/Trip.js")).default;
          const activeTrip = await Trip.findOne({ driverId: driverId, status: { $in: ["driver_assigned", "driver_en_route", "customer_onboard"] } });
          if (activeTrip) {
            const { getDriverToPickupETA } = await import("../services/eta/driverToPickup.js");
            const eta = await getDriverToPickupETA(driver, activeTrip.pickup, global.zoneHeatMap || {});
            // send ETA update via socket
            io.of("/customer").to(String(activeTrip._id)).emit("eta:update", {
              driverLocation: driver.currentLocation || { lat, lng },
              etaMinutes: eta.etaMinutes,
              etaSource: eta.source || null,
              routeGeometry: eta.geometry || null
            });

            // send user-facing ETA popup when significant change (>2 minutes)
            try {
              global.tripEtaCache = global.tripEtaCache || {};
              const prev = global.tripEtaCache[String(activeTrip._id)];
              const curr = eta.etaMinutes || null;
              if (prev === undefined) {
                // first time, send driverAssigned popup to customer
                const driverName = driver.name || 'Driver';
                const assigned = customerTemplates.driverAssigned(driverName, curr || 0);
                sendMessage(io, { type: 'customer', id: String(activeTrip.customerId) }, assigned);
              } else if (curr !== null && Math.abs(curr - prev) >= 2) {
                const payload = customerTemplates.etaUpdated(curr);
                sendMessage(io, { type: 'customer', id: String(activeTrip.customerId) }, payload);
              }
              global.tripEtaCache[String(activeTrip._id)] = curr;
            } catch (err) {
              console.error('ETA popup error', err);
            }
          }
        } catch (err) {
          console.error("ETA update error:", err);
        }

        cb && cb({ success: true });
      } catch (err) {
        console.error("driver:location_update error:", err);
        cb && cb({ error: "Server error" });
      }
    });

    socket.on("disconnect", async () => {
      console.log("Driver disconnected:", driverId, socket.id);
      try {
        const driver = await Driver.findById(driverId);
        if (driver) {
          driver.online = false;
          await driver.save();
        }
        setDriverOffline(driverId);
      } catch (err) {
        console.error("Driver disconnect cleanup error:", err);
      }
    });
  });
};

export default initDriverSocket;
