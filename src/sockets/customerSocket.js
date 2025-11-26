import jwt from "jsonwebtoken";
import Customer from "../models/Customer.js";

export const initCustomerSocket = (io) => {
  const namespace = io.of("/customer");

  namespace.use(async (socket, next) => {
    try {
      const { token } = socket.handshake.auth || {};
      if (!token) return next(); // allow anonymous customers for now

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const customer = await Customer.findById(decoded.customerId);
      if (!customer) return next();

      socket.customer = {
        id: customer._id,
        phone: customer.phone
      };

      next();
    } catch (err) {
      console.error("Customer socket auth error:", err);
      next();
    }
  });

  namespace.on("connection", (socket) => {
    console.log("Customer connected", socket.id);

    // if authenticated, join a room by customerId so server can emit to the customer
    if (socket.customer && socket.customer.id) {
      socket.join(String(socket.customer.id));
    }

    socket.on("joinTripRoom", ({ tripId }) => {
      if (tripId) socket.join(String(tripId));
    });
  });
};

export default initCustomerSocket;
