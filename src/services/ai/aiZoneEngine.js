import { broadcastZoneUpdates } from "../socket/zoneGateway.js";
import { detectDriverShortage } from "./driverShortageService.js";
import { detectHotZones } from "./hotspotService.js";

export const runAIZoneEngine = async () => {
  try {
    const hotZones = await detectHotZones();
    const shortages = await detectDriverShortage(hotZones);

    const output = {};

    for (const zoneId of Object.keys(hotZones)) {
      output[zoneId] = {
        heat: hotZones[zoneId],
        shortage: shortages[zoneId] || "good"
      };
    }

    // publish to gateway
    await broadcastZoneUpdates(output);

    // expose in-memory map for quick access to ETA engine
    try {
      global.zoneHeatMap = output;
    } catch (err) {
      // ignore
    }
  } catch (err) {
    console.error("AI Zone Engine Error:", err);
  }
};
