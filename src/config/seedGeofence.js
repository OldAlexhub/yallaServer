import Geofence from "../models/Geofence.js";

export const seedAlexandriaGeofence = async () => {
  try {
    const exists = await Geofence.findOne({ name: "Alexandria" });
    if (exists) {
      console.log("Alexandria geofence already exists");
      return exists;
    }

    // Governorate-wide Alexandria polygon (expanded to cover city + surrounding governorate areas)
    // This is a generous bounding polygon that covers central Alexandria and nearby districts.
    const polygon = [
      { lat: 31.6000, lng: 29.3000 },
      { lat: 31.6000, lng: 30.2000 },
      { lat: 31.1000, lng: 30.7000 },
      { lat: 30.7000, lng: 30.7000 },
      { lat: 30.4000, lng: 30.2000 },
      { lat: 30.3000, lng: 29.7000 },
      { lat: 30.7000, lng: 29.2000 },
      { lat: 31.2000, lng: 29.1000 },
    ];

    const area = new Geofence({ name: "Alexandria", polygon, active: true });
    await area.save();
    console.log("Seeded Alexandria geofence");
    return area;
  } catch (err) {
    console.error("seedAlexandriaGeofence error:", err);
    throw err;
  }
};
