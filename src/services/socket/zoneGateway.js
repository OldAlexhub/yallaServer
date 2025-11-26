let io = null;

export const initZoneGateway = (ioInstance) => {
  io = ioInstance;
};

export const broadcastZoneUpdates = async (zoneMap) => {
  if (!io) return;
  try {
    io.to("drivers").emit("zones:update", zoneMap);
    io.to("admins").emit("zones:admin", zoneMap);
  } catch (err) {
    console.error("broadcastZoneUpdates error:", err);
  }
};
