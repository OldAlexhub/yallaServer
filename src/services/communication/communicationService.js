
import ioUtil from '../../utils/io.js';

// Communication service uses socket.io to send driver notifications in-app.
const communicationService = {
  sendVoucherSms: async (driverId, code, expiresAt) => {
    try {
      const io = ioUtil.io;
      if (!io) return Promise.resolve();
      const payload = {
        type: 'voucher_created',
        code,
        expiresAt
      };
      // emit to the driver's personal room in /driver namespace
      try {
        io.of('/driver').to(String(driverId)).emit('notification', payload);
      } catch (e) {
        // fallback global emit
        io.to(String(driverId)).emit('notification', payload);
      }
      return Promise.resolve();
    } catch (err) {
      console.error('communicationService sendVoucherSms error', err);
      return Promise.resolve();
    }
  }
};

export default communicationService;
