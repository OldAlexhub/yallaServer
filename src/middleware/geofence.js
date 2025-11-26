import Geofence from "../models/Geofence.js";
import { pointInPolygon } from "../utils/geoPointInPolygon.js";

export const enforceGeofence = async (req, res, next) => {
  try {
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "lat and lng are required" });
    }

    const activeAreas = await Geofence.find({ active: true });

    if (activeAreas.length === 0) {
      return res.status(500).json({ error: "No active geofenced areas configured" });
    }

    let allowed = false;

    activeAreas.forEach((area) => {
      if (pointInPolygon(lat, lng, area.polygon)) {
        allowed = true;
      }
    });

    if (!allowed) {
      return res.status(403).json({ error: "Operation not allowed in this region" });
    }

    next();
  } catch (err) {
    console.error("enforceGeofence error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
