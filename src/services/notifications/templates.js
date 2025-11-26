// Templates for customer and driver notifications
export const customerTemplates = {
  welcome: (name) => ({
    type: "popup",
    title: "Welcome to YallaRide",
    message: `Hey ${name}, your account is ready. Book your first ride in Alexandria.`,
    category: "customer",
    timestamp: Date.now(),
    data: {}
  }),
  founderWelcome: () => ({
    type: "popup",
    title: "Welcome, Founder",
    message: `Thanks for joining YallaRide as a founding user! Enjoy priority support.`,
    category: "customer",
    timestamp: Date.now(),
    data: {}
  }),
  referralSuccess: (friendName) => ({
    type: "popup",
    title: "Referral Successful",
    message: `You referred ${friendName}. Thank you! Your referral credit was applied.`,
    category: "customer",
    timestamp: Date.now(),
    data: { friendName }
  }),
  tripRequested: (tripId) => ({
    type: "system",
    title: "Trip Requested",
    message: `Your trip request ${tripId} was received. Finding drivers nearby.`,
    category: "customer",
    timestamp: Date.now(),
    data: { tripId }
  }),
  driverAssigned: (driverName, etaMinutes) => ({
    type: "popup",
    title: "Driver Assigned",
    message: `${driverName} is coming. ETA ${etaMinutes} min.`,
    category: "customer",
    timestamp: Date.now(),
    data: { driverName, etaMinutes }
  }),
  driverEnroute: (etaMinutes) => ({
    type: "banner",
    title: "Driver En Route",
    message: `Your driver is en route. ETA ${etaMinutes} min.`,
    category: "customer",
    timestamp: Date.now(),
    data: { etaMinutes }
  }),
  driverNearby: () => ({
    type: "popup",
    title: "Driver Nearby",
    message: `Your driver is very close. Please be ready.`,
    category: "customer",
    timestamp: Date.now(),
    data: {}
  }),
  tripStarted: () => ({
    type: "system",
    title: "Trip Started",
    message: `Your trip has started. Have a safe ride!`,
    category: "customer",
    timestamp: Date.now(),
    data: {}
  }),
  tripCompleted: (fare) => ({
    type: "system",
    title: "Trip Completed",
    message: `Trip completed. Fare: ${fare} EGP. Thank you for riding with YallaRide.`,
    category: "customer",
    timestamp: Date.now(),
    data: { fare }
  }),
  tripCanceledByCustomer: () => ({
    type: "alert",
    title: "Trip Cancelled",
    message: `Your trip has been cancelled.`,
    category: "customer",
    timestamp: Date.now(),
    data: {}
  }),
  tripCanceledByDriver: () => ({
    type: "alert",
    title: "Trip Cancelled",
    message: `Your driver cancelled the trip. We're finding a replacement.`,
    category: "customer",
    timestamp: Date.now(),
    data: {}
  }),
  tripCancelWarning: () => ({
    type: "alert",
    title: "Cancellation Warning",
    message: `Multiple cancellations may lead to account restrictions. Please avoid cancelling frequently.`,
    category: "customer",
    timestamp: Date.now(),
    data: {}
  }),
  noShowWarning: () => ({
    type: "alert",
    title: "No-Show Notice",
    message: `You were marked as no-show. Repeated no-shows may result in penalties.`,
    category: "customer",
    timestamp: Date.now(),
    data: {}
  }),
  banned: (reason) => ({
    type: "alert",
    title: "Account Suspended",
    message: `Your account has been suspended. Reason: ${reason}`,
    category: "customer",
    timestamp: Date.now(),
    data: { reason }
  }),
  geofenceWarning: () => ({
    type: "alert",
    title: "Outside Service Area",
    message: `Your pickup is outside our service area. Please select a location within Alexandria.`,
    category: "customer",
    timestamp: Date.now(),
    data: {}
  }),
  etaUpdated: (etaMinutes) => ({
    type: "popup",
    title: "ETA Updated",
    message: `Your driver is now expected in ${etaMinutes} minutes.`,
    category: "customer",
    timestamp: Date.now(),
    data: { etaMinutes }
  }),
  promo: (text) => ({
    type: "banner",
    title: "Promotion",
    message: text,
    category: "customer",
    timestamp: Date.now(),
    data: {}
  }),
  systemAnnouncement: (title, text) => ({
    type: "system",
    title: title,
    message: text,
    category: "customer",
    timestamp: Date.now(),
    data: {}
  })
  ,
  // Admin can send a custom message (title + message) to a customer; appears as popup
  adminMessage: ({ title = 'Message', message = '' } = {}) => ({
    type: 'popup',
    title: title,
    message: message,
    category: 'customer',
    timestamp: Date.now(),
    data: {}
  })
};

export const driverTemplates = {
  approval: () => ({
    type: "popup",
    title: "Driver Approved",
    message: `Your driver account is approved. Welcome to YallaRide.`,
    category: "driver",
    timestamp: Date.now(),
    data: {}
  }),
  rejection: (reason) => ({
    type: "alert",
    title: "Application Rejected",
    message: `Your application was rejected. Reason: ${reason}`,
    category: "driver",
    timestamp: Date.now(),
    data: { reason }
  }),
  subscriptionReminder: (daysRemaining) => ({
    type: "popup",
    title: "Subscription Reminder",
    message: `Your weekly subscription expires in ${daysRemaining} day(s). Renew to keep receiving trips.`,
    category: "driver",
    timestamp: Date.now(),
    data: { daysRemaining }
  }),
  voucherActivated: (expiryDate) => ({
    type: "popup",
    title: "Voucher Activated",
    message: `Your voucher is active until ${new Date(expiryDate).toLocaleDateString()}.`,
    category: "driver",
    timestamp: Date.now(),
    data: { expiryDate }
  }),
  voucherExpiringTomorrow: () => ({
    type: "popup",
    title: "Voucher Expires Tomorrow",
    message: `Your voucher expires tomorrow. Please renew to avoid interruption.`,
    category: "driver",
    timestamp: Date.now(),
    data: {}
  }),
  voucherExpired: () => ({
    type: "alert",
    title: "Voucher Expired",
    message: `Your voucher has expired. You will not receive new trips until you renew.`,
    category: "driver",
    timestamp: Date.now(),
    data: {}
  }),
  documentExpired: (docName) => ({
    type: "alert",
    title: "Document Expired",
    message: `${docName} has expired. Please update your documents.`,
    category: "driver",
    timestamp: Date.now(),
    data: { docName }
  }),
  documentExpiringSoon: (docName) => ({
    type: "popup",
    title: "Document Expiring Soon",
    message: `${docName} will expire soon. Please renew it to avoid suspension.`,
    category: "driver",
    timestamp: Date.now(),
    data: { docName }
  }),
  ignorePenalty: () => ({
    type: "alert",
    title: "Ignored Trips Penalty",
    message: `You have ignored multiple trips. Continued behavior may lead to penalties.`,
    category: "driver",
    timestamp: Date.now(),
    data: {}
  }),
  dailyOffenderPenalty: () => ({
    type: "alert",
    title: "Frequent Offender",
    message: `Multiple infractions detected. Your privileges may be suspended.`,
    category: "driver",
    timestamp: Date.now(),
    data: {}
  }),
  driverBanned: (reason) => ({
    type: "alert",
    title: "Account Banned",
    message: `Your driver account has been banned. Reason: ${reason}`,
    category: "driver",
    timestamp: Date.now(),
    data: { reason }
  }),
  manualDispatch: (pickupAddress, dropoffAddress) => ({
    type: "popup",
    title: "Manual Dispatch",
    message: `You have been dispatched to ${pickupAddress} → ${dropoffAddress}.`,
    category: "driver",
    timestamp: Date.now(),
    data: { pickupAddress, dropoffAddress }
  }),
  heatZoneWarning: (zoneName) => ({
    type: "banner",
    title: "Heat Zone",
    message: `High demand in ${zoneName}. Drive safely and stay alert.`,
    category: "driver",
    timestamp: Date.now(),
    data: { zoneName }
  }),
  geofenceWarning: () => ({
    type: "alert",
    title: "Outside Service Area",
    message: `You are outside the service area. Please return to the covered region.`,
    category: "driver",
    timestamp: Date.now(),
    data: {}
  }),
  fraudAlert: () => ({
    type: "alert",
    title: "Fraud Alert",
    message: `Suspicious activity detected on your account. Please contact support.`,
    category: "driver",
    timestamp: Date.now(),
    data: {}
  }),
  tripAssigned: (tripId, pickupAddress, etaMinutes) => ({
    type: "popup",
    title: "New Trip Assigned",
    message: `Trip ${tripId} assigned: ${pickupAddress}. ETA ${etaMinutes} min.`,
    category: "driver",
    timestamp: Date.now(),
    data: { tripId, pickupAddress, etaMinutes }
  }),
  tripCanceledByCustomer: () => ({
    type: "alert",
    title: "Trip Cancelled",
    message: `Customer cancelled the trip.`,
    category: "driver",
    timestamp: Date.now(),
    data: {}
  }),
  tripCompletedSummary: (tripId, fare) => ({
    type: "system",
    title: "Trip Completed",
    message: `Trip ${tripId} completed. Fare: ${fare} EGP.`,
    category: "driver",
    timestamp: Date.now(),
    data: { tripId, fare }
  })
};

export default { customerTemplates, driverTemplates };
