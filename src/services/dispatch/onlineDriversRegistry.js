// Simple in-memory store for online drivers.
// In production you might replace this with Redis.

const onlineDrivers = new Map();
// key: driverId (string)
// value: { socketId, lat, lng, updatedAt }

export const setDriverOnline = (driverId, { socketId, lat, lng }) => {
  onlineDrivers.set(String(driverId), {
    socketId,
    lat,
    lng,
    updatedAt: new Date()
  });
};

export const setDriverOffline = (driverId) => {
  onlineDrivers.delete(String(driverId));
};

export const updateDriverLocation = (driverId, { lat, lng }) => {
  const existing = onlineDrivers.get(String(driverId));
  if (!existing) return;
  onlineDrivers.set(String(driverId), {
    ...existing,
    lat,
    lng,
    updatedAt: new Date()
  });
};

export const getOnlineDriver = (driverId) => {
  return onlineDrivers.get(String(driverId)) || null;
};

export const getAllOnlineDrivers = () => {
  return Array.from(onlineDrivers.entries()).map(([driverId, data]) => ({
    driverId,
    ...data
  }));
};
