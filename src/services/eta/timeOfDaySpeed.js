export const getTimeOfDaySpeed = (speedProfile) => {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 11) return speedProfile.morningSpeed;
  if (hour >= 11 && hour < 16) return speedProfile.afternoonSpeed;
  if (hour >= 16 && hour < 21) return speedProfile.eveningSpeed;

  return speedProfile.nightSpeed;
};
