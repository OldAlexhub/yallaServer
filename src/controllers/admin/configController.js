import FounderLimit from "../../models/FounderLimit.js";

export const getFounderLimit = async (req, res) => {
  try {
    const founderLimitDoc = await FounderLimit.findOne();
    const limit = founderLimitDoc ? founderLimitDoc.limit : 10000;
    res.json({ founderLimit: limit });
  } catch (err) {
    console.error("getFounderLimit error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateFounderLimit = async (req, res) => {
  try {
    const { value } = req.body;

    if (value === undefined || isNaN(value) || Number(value) < 1) {
      return res.status(400).json({ error: "Founder limit must be a positive number" });
    }

    const updated = await FounderLimit.findOneAndUpdate(
      {},
      { limit: Number(value) },
      { upsert: true, new: true }
    );

    res.json({ success: true, founderLimit: updated.limit });
  } catch (err) {
    console.error("updateFounderLimit error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export default { getFounderLimit, updateFounderLimit };
