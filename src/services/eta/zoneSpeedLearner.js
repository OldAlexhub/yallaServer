import ZoneSpeedProfile from "../../models/ZoneSpeedProfile.js";

export const updateZoneSpeed = async (zoneId, actualTimeMinutes, distanceKm) => {
  if (!distanceKm || distanceKm <= 0 || !actualTimeMinutes || actualTimeMinutes <= 0) return;

  const actualSpeed = (distanceKm / (actualTimeMinutes / 60));

  let doc = await ZoneSpeedProfile.findOne({ zoneId });

  if (!doc) {
    doc = new ZoneSpeedProfile({ zoneId });
  }

  doc.avgSpeedKph = (doc.avgSpeedKph * 0.8) + actualSpeed * 0.2;
  doc.lastUpdated = new Date();

  await doc.save();
};
