import Driver from "../../models/Driver.js";

export const updateDriverDocuments = async (req, res) => {
  try {
    const driverId = req.driver.id;
    const updates = req.body; // expects URLs or base64 references

    const allowedFields = [
      "nationalIdFront",
      "nationalIdBack",
      "driverLicense",
      "vehicleLicense",
      "insurance",
      "criminalRecord",
      "inspectionReport",
      "carPhotos",
      "profilePhoto"
    ];

    const setObj = {};

    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        setObj[`documents.${key}`] = updates[key];
      }
    }

    setObj["documents.status"] = "pending";

    const updated = await Driver.findByIdAndUpdate(
      driverId,
      { $set: setObj },
      { new: true }
    );

    res.json({
      message: "Documents updated and set to pending",
      documents: updated.documents
    });
  } catch (err) {
    console.error("updateDriverDocuments error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
