import FraudDevice from "../../models/FraudDevice.js";

export const listFlaggedDevices = async (req, res) => {
  try {
    const list = await FraudDevice.find({ flagged: true })
      .sort({ updatedAt: -1 })
      .limit(200);

    res.json({ flagged: list });
  } catch (err) {
    console.error("listFlaggedDevices err:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const unbanDevice = async (req, res) => {
  try {
    const { deviceId } = req.body;
    const doc = await FraudDevice.findOneAndUpdate(
      { deviceId },
      { deviceBan: false, flagged: false },
      { new: true }
    );
    res.json({ success: true, device: doc });
  } catch (err) {
    console.error("unbanDevice err:", err);
    res.status(500).json({ error: "Server error" });
  }
};
