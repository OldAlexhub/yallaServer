export const requireFields = (obj, fields) => {
  const missing = [];
  for (const f of fields) {
    if (obj[f] === undefined || obj[f] === null || obj[f] === "") {
      missing.push(f);
    }
  }
  return missing;
};

export const isValidPhoneEgypt = (phone) => {
  return /^01[0-9]{9}$/.test(phone);
};

export const isPositiveNumber = (val) => {
  return typeof val === "number" && !isNaN(val) && val > 0;
};
