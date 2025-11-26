const rateMap = new Map();
const WINDOW_MS = 10 * 1000; // 10 seconds
const MAX_REQUESTS = 30;

export const rateLimiter = (req, res, next) => {
  const key = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  const now = Date.now();
  let entry = rateMap.get(key);

  if (!entry) {
    entry = { count: 1, start: now };
    rateMap.set(key, entry);
    return next();
  }

  if (now - entry.start > WINDOW_MS) {
    entry.count = 1;
    entry.start = now;
    return next();
  }

  entry.count++;

  if (entry.count > MAX_REQUESTS) {
    return res.status(429).json({ error: "Too many requests" });
  }

  next();
};
