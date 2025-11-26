import Driver from "../../models/Driver.js";

export const detectDriverShortage = async (hotZones) => {
  const shortages = {};

  for (const zoneId of Object.keys(hotZones)) {
    const drivers = await Driver.countDocuments({
      "location.zoneId": zoneId,
      status: "online"
    });

    if (drivers < 2) shortages[zoneId] = "critical";
    else if (drivers < 5) shortages[zoneId] = "moderate";
  }

  return shortages;
};
