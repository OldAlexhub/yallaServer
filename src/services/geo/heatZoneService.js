import HeatZone from "../../models/HeatZone.js";
import Trip from "../../models/Trip.js";
import { pointInPolygon } from "../../utils/geoPointInPolygon.js";

// return only active heat zones
export const getActiveHeatZones = async () => {
  return HeatZone.find({ active: true });
};

// very simple demand estimator: count trips in the last X minutes inside each zone
export const recalculateHeatZonesFromTrips = async (minutesWindow = 60) => {
  const cutoff = new Date(Date.now() - minutesWindow * 60 * 1000);

  const zones = await HeatZone.find({ active: true });
  const trips = await Trip.find({
    createdAt: { $gte: cutoff }
  });

  for (const zone of zones) {
    let count = 0;

    for (const trip of trips) {
      if (!trip.pickup || trip.pickup.lat == null || trip.pickup.lng == null) continue;
      const inside = pointInPolygon(trip.pickup.lat, trip.pickup.lng, zone.polygon);
      if (inside) count++;
    }

    // naive thresholds; you can tune later
    let level = "cool";
    if (count >= 3 && count < 7) level = "warm";
    if (count >= 7 && count < 15) level = "hot";
    if (count >= 15) level = "red";

    zone.level = level;
    await zone.save();
  }

  return zones;
};

export default { getActiveHeatZones, recalculateHeatZonesFromTrips };
