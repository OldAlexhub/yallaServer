import TripEventLog from "../../models/TripEventLog.js";

export const detectHotZones = async () => {
  const since = new Date(Date.now() - 1000 * 60 * 15); // last 15 minutes

  const groups = await TripEventLog.aggregate([
    { $match: { timestamp: { $gte: since }, event: "requested" } },
    { $group: { _id: "$zoneId", count: { $sum: 1 } } }
  ]);

  const HOT_THRESHOLD = 5; // 5+ trip requests in 15 minutes
  const WARM_THRESHOLD = 3; // 3–4 trip requests

  const result = {};

  for (const g of groups) {
    if (g.count >= HOT_THRESHOLD) {
      result[g._id] = "hot";
    } else if (g.count >= WARM_THRESHOLD) {
      result[g._id] = "warm";
    }
  }

  return result; // { "zoneId": "hot/warm", ... }
};
