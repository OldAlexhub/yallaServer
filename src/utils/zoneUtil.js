export const mapToZone = (lat, lng) => {
  const size = 0.01; // ~1km grid
  const zLat = Math.floor(lat / size);
  const zLng = Math.floor(lng / size);
  return `${zLat}_${zLng}`;
};
