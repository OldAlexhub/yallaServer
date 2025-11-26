import { initZoneGateway } from "../services/socket/zoneGateway.js";
import initAdminSocket from "../sockets/adminSocket.js";
import { initCustomerSocket } from "../sockets/customerSocket.js";
import initDriverSocket from "../sockets/driverSocket.js";

export const initSocket = (io) => {
  initZoneGateway(io);

  // pass the full Server instance; individual modules will call `io.of()` as needed
  initDriverSocket(io);
  initCustomerSocket(io);
  initAdminSocket(io);

  console.log("✓ Socket.IO initialized");
};
