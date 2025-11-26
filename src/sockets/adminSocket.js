import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

export default function initAdminSocket(io) {
  const adminNs = io.of("/admin");

  adminNs.use(async (socket, next) => {
    try {
      const { token } = socket.handshake.auth || {};
      if (!token) return next(new Error("No token provided"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const admin = await Admin.findById(decoded.adminId);
      if (!admin) return next(new Error("Admin not found"));

      socket.admin = { id: admin._id, role: admin.role, email: admin.email };
      next();
    } catch (err) {
      console.error("Admin socket auth error:", err);
      next(new Error("Unauthorized"));
    }
  });

  adminNs.on("connection", (socket) => {
    console.log("Admin connected:", socket.id, socket.admin && socket.admin.email);
    // join admins room
    socket.join("admins");
    if (socket.admin && socket.admin.id) socket.join(String(socket.admin.id));
  });
}
