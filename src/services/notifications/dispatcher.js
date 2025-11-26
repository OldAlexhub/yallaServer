export const sendMessage = (io, target, payload) => {
  try {
    if (!io || !target || !payload) {
      console.warn("sendMessage missing params");
      return;
    }

    const t = target.type;
    switch (t) {
      case "customer":
        if (!target.id) return console.warn("customer target missing id");
        return io.of("/customer").to(target.id).emit(payload.type, payload);
      case "driver":
        if (!target.id) return console.warn("driver target missing id");
        return io.of("/driver").to(target.id).emit(payload.type, payload);
      case "all_customers":
        return io.of("/customer").emit(payload.type, payload);
      case "all_drivers":
        return io.of("/driver").emit(payload.type, payload);
      case "zone_drivers":
        if (!Array.isArray(target.driverIds)) return console.warn("zone_drivers missing driverIds");
        for (const id of target.driverIds) {
          io.of("/driver").to(id).emit(payload.type, payload);
        }
        return;
      case "trip_group":
        if (!target.tripId) return console.warn("trip_group missing tripId");
        // emit to room named by tripId (customers/drivers join trip rooms by tripId)
        const room = String(target.tripId);
        io.of("/customer").to(room).emit(payload.type, payload);
        io.of("/driver").to(room).emit(payload.type, payload);
        return;
      default:
        return console.warn("Unknown sendMessage target type:", t);
    }
  } catch (err) {
    console.error("sendMessage error:", err);
  }
};

export default { sendMessage };
