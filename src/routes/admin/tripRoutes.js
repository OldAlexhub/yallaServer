import express from "express";
import { adminAuth } from "../../middleware/adminAuth.js";
import { requireAdminRole } from "../../middleware/adminRoles.js";
import Customer from "../../models/Customer.js";
import Driver from "../../models/Driver.js";
import Trip from "../../models/Trip.js";

const router = express.Router();

router.get(
  "/",
  adminAuth,
  requireAdminRole(["superadmin", "dispatcher", "support"]),
  async (req, res) => {
    try {
      const { status, driverId, customerId, page = 1, limit = 10 } = req.query;
      const query = {};
      if (status) query.status = status;
      if (driverId) query.driverId = driverId;
      if (customerId) query.customerId = customerId;
      
      const trips = await Trip.find(query)
        .populate('driverId', 'name phone')
        .populate('customerId', 'name phone')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      
      const total = await Trip.countDocuments(query);
      res.json({ trips, total, page: parseInt(page), pages: Math.ceil(total / limit) });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Fetch assignment logs (telemetry)
router.get(
  "/assignments",
  adminAuth,
  requireAdminRole(["superadmin", "dispatcher", "support"]),
  async (req, res) => {
    try {
      const AssignmentLog = (await import('../../models/AssignmentLog.js')).default;
      const { tripId, driverId, page = 1, limit = 50 } = req.query;
      const q = {};
      if (tripId) q.tripId = tripId;
      if (driverId) q.driverId = driverId;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const logs = await AssignmentLog.find(q).sort({ timestamp: -1 }).skip(skip).limit(parseInt(limit));
      const total = await AssignmentLog.countDocuments(q);
      res.json({ logs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
    } catch (err) {
      console.error('fetch assignments error', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Assignment stats (average attempts and broadcast counts)
router.get(
  '/assignments/stats',
  adminAuth,
  requireAdminRole(['superadmin', 'dispatcher', 'support']),
  async (req, res) => {
    try {
      const AssignmentLog = (await import('../../models/AssignmentLog.js')).default;

      // average attempts per trip (count offers+reoffers)
      const attemptsAgg = await AssignmentLog.aggregate([
        { $match: { action: { $in: ['offer', 'reoffer', 'rejected', 'accepted'] } } },
        { $group: { _id: '$tripId', attempts: { $sum: 1 } } },
        { $group: { _id: null, avgAttempts: { $avg: '$attempts' }, tripsCount: { $sum: 1 } } }
      ]);

      const broadcasts = await AssignmentLog.countDocuments({ action: 'broadcast' });

      const avgAttempts = attemptsAgg && attemptsAgg[0] ? attemptsAgg[0].avgAttempts : 0;
      const tripsCount = attemptsAgg && attemptsAgg[0] ? attemptsAgg[0].tripsCount : 0;

      res.json({ avgAttempts: Number(avgAttempts || 0), tripsCount, broadcasts });
    } catch (err) {
      console.error('assignment stats error', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.get(
  "/:id",
  adminAuth,
  requireAdminRole(["superadmin", "dispatcher", "support"]),
  async (req, res) => {
    try {
      const trip = await Trip.findById(req.params.id)
        .populate('driverId', 'name phone')
        .populate('customerId', 'name phone');
      if (!trip) return res.status(404).json({ error: "Trip not found" });
      res.json({ trip });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.post(
  "/manual",
  adminAuth,
  requireAdminRole(["superadmin", "dispatcher"]),
  async (req, res) => {
    try {
      const {
        customerPhone,
        customerName,
        pickupAddress,
        dropoffAddress,
        notes,
        manualAssign,
        scheduledAt // New field for scheduling
      } = req.body;

      // Find or create customer
      let customer = await Customer.findOne({ phone: customerPhone });
      if (!customer) {
        customer = new Customer({
          phone: customerPhone,
          name: customerName || `Customer ${customerPhone}`
        });
        await customer.save();
      }

      // Basic geocoding simulation (in real app, use a geocoding service)
      // For now, we'll store addresses as-is and assume coordinates are provided later
      const pickup = {
        address: pickupAddress,
        lat: null, // Would be geocoded
        lng: null
      };

      const dropoff = {
        address: dropoffAddress,
        lat: null, // Would be geocoded
        lng: null
      };

      // Determine status based on scheduling
      let status = "requested";
      let scheduledDate = null;

      if (scheduledAt) {
        const scheduledTime = new Date(scheduledAt);
        const now = new Date();

        if (scheduledTime > now) {
          status = "scheduled";
          scheduledDate = scheduledTime;
        }
      }

      const trip = new Trip({
        customerId: customer._id,
        pickup,
        dropoff,
        status,
        scheduledAt: scheduledDate,
        notes: notes || ""
      });

      await trip.save();

      // Populate customer data for response
      await trip.populate('customerId', 'name phone');

      res.json({
        success: true,
        trip: {
          _id: trip._id,
          customer: trip.customerId,
          pickup: trip.pickup,
          dropoff: trip.dropoff,
          status: trip.status,
          scheduledAt: trip.scheduledAt,
          notes: trip.notes,
          driver: null
        }
      });
    } catch (err) {
      console.error("Manual trip creation error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.post(
  "/:tripId/reassign",
  adminAuth,
  requireAdminRole(["superadmin", "dispatcher"]),
  async (req, res) => {
    try {
      const { driverId } = req.body;
      const trip = await Trip.findById(req.params.tripId);
      if (!trip) return res.status(404).json({ error: "Trip not found" });
      trip.driverId = driverId;
      trip.status = 'assigned';
      await trip.save();
      res.json({ trip });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.post(
  "/:tripId/activate",
  adminAuth,
  requireAdminRole(["superadmin", "dispatcher"]),
  async (req, res) => {
    try {
      const trip = await Trip.findById(req.params.tripId);
      if (!trip) return res.status(404).json({ error: "Trip not found" });

      // Only scheduled trips should be activated here
      if (trip.status !== 'scheduled') return res.status(400).json({ error: 'Trip is not scheduled' });

      trip.status = 'requested';
      trip.scheduledAt = null;
      await trip.save();

      // try to assign using assignment engine
      try {
        const { default: assignmentEngine } = await import('../../services/dispatch/assignmentEngine.js');
        await assignmentEngine.tryAssignInitialDriver(trip._id, req.io || null);
      } catch (err) {
        console.warn('assignment try on admin activation failed', err);
      }

      return res.json({ success: true, trip });
    } catch (err) {
      console.error('activate trip error', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.get(
  "/drivers/nearby",
  adminAuth,
  requireAdminRole(["superadmin", "dispatcher"]),
  async (req, res) => {
    try {
      const { lat, lng, radius = 5000 } = req.query;
      const drivers = await Driver.find({
        location: {
          $near: {
            $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: parseInt(radius)
          }
        },
        online: true
      }).limit(20);
      res.json({ drivers });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.get(
  "/list",
  adminAuth,
  requireAdminRole(["superadmin", "dispatcher", "support"]),
  async (req, res) => {
    try {
      const trips = await Trip.find().sort({ createdAt: -1 });
      res.json({ trips });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

export default router;
