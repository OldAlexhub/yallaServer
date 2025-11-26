import { getActiveHeatZones } from "../../services/geo/heatZoneService.js";

export const getHeatZonesPublic = async (req, res) => {
  try {
    const zones = await getActiveHeatZones();
    res.json({ zones });
  } catch (err) {
    console.error("getHeatZonesPublic error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export default { getHeatZonesPublic };
