import Driver from "../../models/Driver.js";
import Geofence from "../../models/Geofence.js";
import {
    setDriverOffline,
    setDriverOnline
} from "../../services/dispatch/onlineDriversRegistry.js";
import { ensureSubscriptionValidity } from "../../services/subscription/subscriptionService.js";
import { pointInPolygon } from "../../utils/geoPointInPolygon.js";

const isInsideAnyActiveGeofence = async (lat, lng) => {
  const activeAreas = await Geofence.find({ active: true });
  if (!activeAreas.length) return false;

  for (const area of activeAreas) {
    if (pointInPolygon(lat, lng, area.polygon)) return true;
  }
  return false;
};

export const goOnline = async (req, res) => {
  try {
    const driverId = req.driver.id;
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "lat and lng are required" });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ error: "Driver not found" });

    await ensureSubscriptionValidity(driver);

    if (!driver.subscription.active) {
      return res.status(403).json({ error: "Subscription inactive. Redeem voucher." });
    }

    if (driver.penalty && driver.penalty.active) {
      return res.status(403).json({ error: "You are under penalty and cannot go online." });
    }

    if (!driver.documents || driver.documents.status !== "approved") {
      return res.status(403).json({ error: "Documents not approved yet." });
    }

    const inside = await isInsideAnyActiveGeofence(lat, lng);
    if (!inside) {
      return res.status(403).json({ error: "You are outside the service area." });
    }

    driver.online = true;
    driver.currentLocation = { lat, lng };
    await driver.save();

    setDriverOnline(driverId, { socketId: null, lat, lng });

    res.json({ message: "Driver is now online", online: true });
  } catch (err) {
    console.error("goOnline error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const goOffline = async (req, res) => {
  try {
    const driverId = req.driver.id;
    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ error: "Driver not found" });

    driver.online = false;
    await driver.save();

    setDriverOffline(driverId);

    res.json({ message: "Driver is now offline", online: false });
  } catch (err) {
    console.error("goOffline error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
