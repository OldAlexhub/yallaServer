import ZoneSpeedProfile from "../../models/ZoneSpeedProfile.js";
import { haversineKm } from "../../utils/distance.js";
import { mapToZone } from "../../utils/zoneUtil.js";
import routingClient from "../routing/routingClient.js";
import { getTimeOfDaySpeed } from "./timeOfDaySpeed.js";

export const estimateTravelTime = async (start, end, zoneHeatMap = {}) => {
  // Try routing service (ORS) first for a high-fidelity route and duration
  try {
    const route = await routingClient.getRoute({ from: start, to: end, overview: "simplified", steps: false, annotations: false });
    if (route && route.duration) {
      let minutes = route.duration / 60;
      // apply heat multipliers if present
      const zoneId = mapToZone(start.lat, start.lng);
      const heat = zoneHeatMap && zoneHeatMap[zoneId] ? zoneHeatMap[zoneId].heat || zoneHeatMap[zoneId] : zoneHeatMap[zoneId];
      if (heat === "hot") minutes *= 1.35;
      else if (heat === "warm") minutes *= 1.15;

      return {
        distanceKm: route.distance ? route.distance / 1000 : haversineKm(start.lat, start.lng, end.lat, end.lng),
        etaMinutes: Math.max(2, Math.round(minutes)),
        source: "routing",
        geometry: route.geometry
      };
    }
  } catch (err) {
    console.warn("Routing estimate failed, falling back", err.message);
  }

  // Fallback to learned zone speeds + haversine estimate
  const distanceKm = haversineKm(start.lat, start.lng, end.lat, end.lng);
  const zoneId = mapToZone(start.lat, start.lng);
  const speedDoc = await ZoneSpeedProfile.findOne({ zoneId });
  let baseSpeed = speedDoc ? getTimeOfDaySpeed(speedDoc) : 25;
  const heat = zoneHeatMap && zoneHeatMap[zoneId] ? zoneHeatMap[zoneId].heat || zoneHeatMap[zoneId] : zoneHeatMap[zoneId];
  if (heat === "hot") baseSpeed *= 0.65;
  else if (heat === "warm") baseSpeed *= 0.8;
  const minutes = (distanceKm / baseSpeed) * 60;
  return {
    distanceKm,
    etaMinutes: Math.max(2, Math.round(minutes)),
    source: "heuristic"
  };
};
