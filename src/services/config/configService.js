import SystemConfig from "../../models/SystemConfig.js";

export const getConfigValue = async (key, defaultValue = null) => {
  const doc = await SystemConfig.findOne({ key });
  return doc ? doc.value : defaultValue;
};

export const setConfigValue = async (key, value) => {
  const doc = await SystemConfig.findOneAndUpdate(
    { key },
    { value },
    { new: true, upsert: true }
  );
  return doc;
};

export default { getConfigValue, setConfigValue };
