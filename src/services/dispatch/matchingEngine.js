import { getAllOnlineDrivers } from "./onlineDriversRegistry.js";

const calcDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

export const findNearestDriver = async (lat, lng, radiusKm = 5) => {
  const onlineDrivers = getAllOnlineDrivers();

  let nearest = null;
  let nearestDist = Infinity;

  for (const d of onlineDrivers) {
    if (!d.lat || !d.lng) continue;

    const dist = calcDistance(lat, lng, d.lat, d.lng);

    if (dist < nearestDist && dist <= radiusKm) {
      nearest = {
        driverId: d.driverId,
        socketId: d.socketId,
        dist
      };
      nearestDist = dist;
    }
  }

  return nearest;
};

export const findDriversWithinRadius = async (lat, lng, radiusKm = 5) => {
  const onlineDrivers = getAllOnlineDrivers();

  const results = [];
  for (const d of onlineDrivers) {
    if (!d.lat || !d.lng) continue;
    const dist = calcDistance(lat, lng, d.lat, d.lng);
    if (dist <= radiusKm) {
      results.push({
        driverId: d.driverId,
        socketId: d.socketId,
        dist,
        lat: d.lat,
        lng: d.lng
      });
    }
  }

  return results.sort((a, b) => a.dist - b.dist);
};
