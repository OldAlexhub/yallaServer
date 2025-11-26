
import cors from "cors";
import express from "express";
import helmet from "helmet";
import http from "http";
import morgan from "morgan";
import { Server } from "socket.io";
import "./src/bootstrap/loadEnv.js";

import { connectDB } from "./src/bootstrap/connectDB.js";
import { startAIZones } from "./src/bootstrap/initAIZones.js";
import { initSocket } from "./src/bootstrap/initSocket.js";
import communicationRoutes from "./src/routes/admin/communicationRoutes.js";
import { setIO } from "./src/utils/io.js";

import axios from "axios";
import mongoose from "mongoose";
import { deviceFingerprint } from "./src/middleware/deviceFingerprint.js";
import { globalErrorHandler, notFoundHandler } from "./src/middleware/errorHandlers.js";
import { rateLimiter } from "./src/middleware/rateLimiter.js";

/* ROUTES */
import adminAuthRoutes from "./src/routes/admin/authRoutes.js";
import configRoutes from "./src/routes/admin/configRoutes.js";
import customerAdminRoutes from "./src/routes/admin/customerAdminRoutes.js";
import customerDiscountsRoutes from "./src/routes/admin/customerDiscountsRoutes.js";
import driverAdminRoutes from "./src/routes/admin/driverAdminRoutes.js";
import fraudRoutes from "./src/routes/admin/fraudRoutes.js";
import heatZoneRoutes from "./src/routes/admin/heatZoneRoutes.js";
import loyaltyAdminRoutes from "./src/routes/admin/loyaltyAdminRoutes.js";
import manageRoutes from "./src/routes/admin/manageRoutes.js";
import onboardingControlRoutes from "./src/routes/admin/onboardingControlRoutes.js";
import paymentRoutes from "./src/routes/admin/paymentRoutes.js";
import settingsRoutes from "./src/routes/admin/settingsRoutes.js";
import shiftRoutes from "./src/routes/admin/shiftRoutes.js";
import subscriptionRoutes from "./src/routes/admin/subscriptionRoutes.js";
import tripAdminRoutes from "./src/routes/admin/tripRoutes.js";
import voucherAdminRoutes from "./src/routes/admin/voucherRoutes.js";
import announcementRoutes from "./src/routes/customer/announcementRoutes.js";
import customerAuthRoutes from "./src/routes/customer/authRoutes.js";
import loyaltyRoutes from "./src/routes/customer/loyaltyRoutes.js";
import driverRoutes from "./src/routes/driver/index.js";
import routingRoutes from "./src/routes/routingRoutes.js";
import tripRoutes from "./src/routes/tripRoutes.js";

/* APP INIT */
const app = express();
const server = http.createServer(app);

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// expose io instance to other modules
setIO(io);

global.serverStart = Date.now();

const ORS_DIRECTIONS_URL = "https://api.openrouteservice.org/v2/directions/driving-car";
const ORS_HEALTH_COORDS = [
  [31.2357, 30.0444],
  [31.2400, 30.0500]
];

const checkORSReachable = async () => {
  if (!process.env.ORS_API_KEY) {
    return false;
  }

  try {
    await axios.post(
      ORS_DIRECTIONS_URL,
      {
        coordinates: ORS_HEALTH_COORDS,
        format: "geojson"
      },
      {
        headers: {
          Authorization: process.env.ORS_API_KEY,
          "Content-Type": "application/json"
        },
        timeout: 3000
      }
    );
    return true;
  } catch (err) {
    return false;
  }
};

const getRoutingHealth = async () => {
  const service = process.env.ORS_API_KEY ? "OpenRouteService" : "None";
  const reachable = process.env.ORS_API_KEY ? await checkORSReachable() : false;
  return { service, reachable };
};

/* MIDDLEWARE */
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(rateLimiter);
app.use(deviceFingerprint);

// serve public static assets (health page)
// helper to build health payload
const getHealthData = async () => {
  const mongoState = mongoose.connection.readyState; // 0 disconnected,1 connected,2 connecting,3 disconnecting
  let mongo = { state: mongoState, connected: mongoState === 1 };
  const routing = await getRoutingHealth();

  return {
    ok: true,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    startedAt: new Date(global.serverStart).toISOString(),
    mongo,
    routing
  };
};

// Root handler: return JSON for CLI clients (curl/httpie) or when Accept: application/json
app.get('/', async (req, res, next) => {
  const accept = (req.headers.accept || '').toLowerCase();
  const ua = (req.headers['user-agent'] || '').toLowerCase();
  const wantsJson = accept.includes('application/json') || ua.includes('curl') || ua.includes('httpie');
  if (wantsJson) {
    try {
      const data = await getHealthData();
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ ok: false, error: 'health check failed' });
    }
  }
  // otherwise fall through to static file serving (index.html)
  return next();
});

// serve public static assets (health page)
app.use(express.static("public"));

// attach io to requests
app.use((req, res, next) => {
  req.io = io;
  next();
});

// mount admin communication routes
app.use("/admin/comm", communicationRoutes);

/* ROUTING */
app.use("/customer/auth", customerAuthRoutes);
app.use("/customer/announcement", announcementRoutes);
app.use("/driver", driverRoutes);
app.use("/admin/auth", adminAuthRoutes);
app.use("/trip", tripRoutes);
app.use("/routing", routingRoutes);
app.use("/customer/loyalty", loyaltyRoutes);
app.use("/admin/loyalty", loyaltyAdminRoutes);
app.use("/admin/config", configRoutes);
app.use("/admin/fraud", fraudRoutes);
app.use("/admin/manage", manageRoutes);
app.use("/admin/customers", customerAdminRoutes);
app.use("/admin/voucher", voucherAdminRoutes);
app.use("/admin/drivers", driverAdminRoutes);
app.use("/admin/shifts", shiftRoutes);
app.use("/admin/subscriptions", subscriptionRoutes);
app.use("/admin/trips", tripAdminRoutes);
app.use("/admin/payments", paymentRoutes);
app.use("/admin/heat-zones", heatZoneRoutes);
app.use("/admin/settings", settingsRoutes);
app.use("/admin/onboarding-control", onboardingControlRoutes);
app.use("/admin/customer-discounts", customerDiscountsRoutes);

// health endpoint for DB + routing
app.get("/health", async (req, res) => {
  try {
    const data = await getHealthData();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ ok: false, error: "health check failed" });
  }
});

/* STARTUP */
(async () => {
  await connectDB();
  // Ensure a default Alexandria geofence exists in development/test environments
  try {
    const { seedAlexandriaGeofence } = await import('./src/config/seedGeofence.js');
    await seedAlexandriaGeofence();
  } catch (err) {
    console.warn('Could not seed Alexandria geofence:', err.message || err);
  }
  // Ensure onboarding control has a default document so admin UI can read/update it
  try {
    const { default: OnboardingControl } = await import('./src/models/OnboardingControl.js');
    const existing = await OnboardingControl.findOne();
    if (!existing) {
      await OnboardingControl.create({});
      console.log('Created default OnboardingControl document');
    }
  } catch (err) {
    console.warn('Could not ensure onboarding control defaults:', err.message || err);
  }
  // Ensure customer discounts default document exists
  try {
    const { default: CustomerDiscounts } = await import('./src/models/CustomerDiscounts.js');
    const existing = await CustomerDiscounts.findOne();
    if (!existing) {
      await CustomerDiscounts.create({});
      console.log('Created default CustomerDiscounts document');
    }
  } catch (err) {
    console.warn('Could not ensure customer discounts defaults:', err.message || err);
  }
  // routing health check will be performed on demand (ORS) — removed init routing preflight
  initSocket(io);
  startAIZones();

  // start subscription reminder job (hourly)
  // setInterval(() => {
  //   try {
  //     processDriverSubscriptionReminders(io);
  //   } catch (err) {
  //     console.error('subscription reminder error', err);
  //   }
  // }, 60 * 60 * 1000);

  // start assignment processor for offers/retries
  try {
    const { default: assignmentEngine } = await import('./src/services/dispatch/assignmentEngine.js');
    assignmentEngine.startAssignmentProcessor(io);
  } catch (err) {
    console.warn('Could not start assignment processor:', err);
  }

  // start scheduled trip activation job (every minute) - use assignment engine to try assigning when a scheduled trip is due
  setInterval(async () => {
    try {
      const Trip = (await import("./src/models/Trip.js")).default;
      const { default: assignmentEngine } = await import('./src/services/dispatch/assignmentEngine.js');

      const now = new Date();
      const dueTrips = await Trip.find({ status: 'scheduled', scheduledAt: { $lte: now } });
      for (const trip of dueTrips) {
        if (trip.status !== 'scheduled') continue;
        // activate and attempt assignment
        trip.status = 'requested';
        trip.scheduledAt = null;
        await trip.save();
        console.log(`Activating scheduled trip ${trip._id} at ${now.toISOString()}`);
        // Attempt initial single-driver offer
        await assignmentEngine.tryAssignInitialDriver(trip._id, io);
      }
    } catch (err) {
      console.error('scheduled trip activation error', err);
    }
  }, 60 * 1000);

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})();

// 404 + global error handler (must be last)
app.use(notFoundHandler);
app.use(globalErrorHandler);

