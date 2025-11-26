export const normalizeEmail = (value) => {
  if (!value) return null;
  return value.toLowerCase().trim();
};

export const escapeRegExp = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
