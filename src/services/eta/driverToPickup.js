import { estimateTravelTime } from "./etaEngine.js";

export const getDriverToPickupETA = async (driver, pickup, zoneHeatMap) => {
  if (!driver || !driver.currentLocation || !driver.currentLocation.lat) {
    return { etaMinutes: 999, distanceKm: 0 };
  }

  return estimateTravelTime(
    { lat: driver.currentLocation.lat, lng: driver.currentLocation.lng },
    pickup,
    zoneHeatMap
  );
};
