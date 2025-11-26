import HeatZone from "../../models/HeatZone.js";
import { recalculateHeatZonesFromTrips } from "../../services/geo/heatZoneService.js";
import { io } from "../../utils/io.js";

export const createHeatZone = async (req, res) => {
  try {
    const { name, polygon, label } = req.body;

    if (!name || !polygon || !Array.isArray(polygon)) {
      return res.status(400).json({ error: "name and polygon array required" });
    }

    const zone = new HeatZone({
      name,
      polygon,
      label: label || ""
    });

    await zone.save();

    res.json({ success: true, zone });
  } catch (err) {
    console.error("createHeatZone error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateHeatZone = async (req, res) => {
  try {
    const { id, name, polygon, label, active, level } = req.body;

    const zone = await HeatZone.findById(id);
    if (!zone) return res.status(404).json({ error: "Zone not found" });

    if (name !== undefined) zone.name = name;
    if (polygon && Array.isArray(polygon)) zone.polygon = polygon;
    if (label !== undefined) zone.label = label;
    if (active !== undefined) zone.active = active;
    if (level && ["cool", "warm", "hot", "red"].includes(level)) zone.level = level;

    await zone.save();

    res.json({ success: true, zone });
  } catch (err) {
    console.error("updateHeatZone error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteHeatZone = async (req, res) => {
  try {
    const { id } = req.body;
    const zone = await HeatZone.findByIdAndDelete(id);
    if (!zone) return res.status(404).json({ error: "Zone not found" });

    res.json({ success: true });
  } catch (err) {
    console.error("deleteHeatZone error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const listHeatZones = async (req, res) => {
  try {
    const zones = await HeatZone.find().sort({ createdAt: -1 });
    res.json({ zones });
  } catch (err) {
    console.error("listHeatZones error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const recalcHeatZones = async (req, res) => {
  try {
    const { windowMinutes } = req.body;
    const zones = await recalculateHeatZonesFromTrips(windowMinutes || 60);

    // broadcast updated zones to drivers (so maps can update)
    io.of("/driver").emit("heatzones:update", zones);

    res.json({ success: true, zones });
  } catch (err) {
    console.error("recalcHeatZones error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getZoneStats = async (req, res) => {
  try {
    const { zoneId } = req.params;
    const zone = await HeatZone.findById(zoneId);
    if (!zone) return res.status(404).json({ error: "Zone not found" });

    // Get trip count in this zone for last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const Trip = (await import("../../models/Trip.js")).default;
    const tripCount = await Trip.countDocuments({
      createdAt: { $gte: yesterday },
      pickupLocation: {
        $geoWithin: {
          $geometry: {
            type: "Polygon",
            coordinates: [zone.polygon]
          }
        }
      }
    });

    res.json({
      zone,
      stats: {
        tripCount,
        last24Hours: tripCount
      }
    });
  } catch (err) {
    console.error("getZoneStats error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const overrideZone = async (req, res) => {
  try {
    const { zoneId } = req.params;
    const { state } = req.body;

    const zone = await HeatZone.findById(zoneId);
    if (!zone) return res.status(404).json({ error: "Zone not found" });

    zone.active = state === "active";
    await zone.save();

    res.json({ success: true, zone });
  } catch (err) {
    console.error("overrideZone error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateClusteringParams = async (req, res) => {
  try {
    const { minPoints, maxDistance, timeWindow } = req.body;

    // Update heat zone clustering params
    const HeatZoneClustering = (await import("../../models/HeatZoneClustering.js")).default;
    await HeatZoneClustering.findOneAndUpdate(
      {},
      { minPoints, maxDistance, timeWindow },
      { upsert: true, new: true }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("updateClusteringParams error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export default { createHeatZone, updateHeatZone, deleteHeatZone, listHeatZones, recalcHeatZones, getZoneStats, overrideZone, updateClusteringParams };
