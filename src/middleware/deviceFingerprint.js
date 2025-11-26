import crypto from "crypto";

export const deviceFingerprint = (req, res, next) => {
  const incoming = req.headers["x-device-id"];

  let fingerprint = incoming;

  if (!fingerprint) {
    const raw = (req.headers["user-agent"] || "") + "|" + (req.ip || "");
    fingerprint = crypto.createHash("sha256").update(raw).digest("hex");
  }

  req.deviceId = fingerprint;
  next();
};
