import { runAIZoneEngine } from "../services/ai/aiZoneEngine.js";

export const startAIZones = () => {
  setInterval(() => {
    runAIZoneEngine();
  }, 60000);

  console.log("✓ AI Zone engine running (interval: 60s)");
};
