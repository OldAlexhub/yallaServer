import Geofence from "../../models/Geofence.js";

export const createGeofenceArea = async (req, res) => {
  try {
    const { name, polygon } = req.body;

    if (!name || !polygon || !Array.isArray(polygon)) {
      return res.status(400).json({ error: "name and polygon array required" });
    }

    const area = new Geofence({ name, polygon });
    await area.save();

    res.json({ message: "Geofence area created", area });
  } catch (err) {
    console.error("createGeofenceArea error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateGeofenceArea = async (req, res) => {
  try {
    const { name, polygon, active } = req.body;

    const area = await Geofence.findOne({ name });
    if (!area) {
      return res.status(404).json({ error: "Area not found" });
    }

    if (polygon) area.polygon = polygon;
    if (active !== undefined) area.active = active;

    await area.save();

    res.json({ message: "Geofence area updated", area });
  } catch (err) {
    console.error("updateGeofenceArea error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const listGeofenceAreas = async (req, res) => {
  try {
    const areas = await Geofence.find();
    res.json({ areas });
  } catch (err) {
    console.error("listGeofenceAreas error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
