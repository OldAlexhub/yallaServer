import routingClient from "../services/routing/routingClient.js";
import { fail, ok } from "../utils/apiResponse.js";

export async function getRouteHandler(req, res) {
  try {
    const { fromLat, fromLng, toLat, toLng } = req.query;
    if (!fromLat || !fromLng || !toLat || !toLng) {
      return fail(res, "Missing coordinates", 400);
    }
    const from = { lat: parseFloat(fromLat), lng: parseFloat(fromLng) };
    const to = { lat: parseFloat(toLat), lng: parseFloat(toLng) };
    const route = await routingClient.getRoute({ from, to, overview: "full", steps: true, annotations: true });
    if (!route) return fail(res, "Routing service unavailable", 502);

    // Normalize geometry format
    let geometry = route.geometry;
    if (Array.isArray(geometry) && geometry.length > 0 && Array.isArray(geometry[0])) {
      // ORS format: convert to encoded polyline
      geometry = encodePolyline(geometry.map(coord => [coord[1], coord[0]])); // lat,lng to lng,lat
    }

    return ok(res, { route: { ...route, geometry } });
  } catch (err) {
    console.error("getRouteHandler error", err);
    return fail(res, "Server error", 500);
  }
}

// Simple polyline encoder
function encodePolyline(coordinates) {
  let result = '';
  let prevLat = 0, prevLng = 0;
  for (const coord of coordinates) {
    const lat = Math.round(coord[1] * 1e5);
    const lng = Math.round(coord[0] * 1e5);
    result += encodeNumber(lat - prevLat);
    result += encodeNumber(lng - prevLng);
    prevLat = lat;
    prevLng = lng;
  }
  return result;
}

function encodeNumber(num) {
  num = num << 1;
  if (num < 0) num = ~num;
  let result = '';
  while (num >= 0x20) {
    result += String.fromCharCode((0x20 | (num & 0x1f)) + 63);
    num >>= 5;
  }
  result += String.fromCharCode(num + 63);
  return result;
}
