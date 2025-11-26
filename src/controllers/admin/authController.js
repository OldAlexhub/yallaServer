import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../../models/Admin.js";
import { normalizeEmail, escapeRegExp } from "../../utils/emailHelpers.js";

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password)
      return res.status(400).json({ error: "Email and password are required" });

    let admin = await Admin.findOne({ email: normalizedEmail });
    if (!admin) {
      const emailRegex = new RegExp(`^${escapeRegExp(normalizedEmail)}$`, "i");
      admin = await Admin.findOne({ email: emailRegex });
    }

    if (!admin) return res.status(404).json({ error: "Admin not found" });

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      {
        adminId: admin._id,
        role: admin.role,
        email: admin.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const adminMe = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-passwordHash');
    if (!admin) return res.status(404).json({ error: "Admin not found" });

    res.json({
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    });
  } catch (err) {
    console.error("Admin me error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const adminLogout = async (req, res) => {
  try {
    // token was checked by adminAuth middleware already
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    // check if admin has any open or closing_requested shifts
    const openShift = await CashShift.findOne({ adminId: req.admin.id, status: { $in: ["open", "closing_requested"] } });
    if (openShift) return res.status(400).json({ error: "Cannot logout: you have an active or pending shift. Please complete checkout and get supervisor approval." });

    if (token) {
      // decode token to get expiry
      let exp = null;
      try {
        const decoded = jwt.decode(token);
        if (decoded && decoded.exp) exp = new Date(decoded.exp * 1000);
      } catch (e) {
        exp = new Date(Date.now() + 24 * 3600 * 1000);
      }

      // add to blacklist
      await TokenBlacklist.create({ token, expiresAt: exp || new Date(Date.now() + 24 * 3600 * 1000) });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('adminLogout error', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
