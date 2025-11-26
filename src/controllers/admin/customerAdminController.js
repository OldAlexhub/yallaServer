import Customer from "../../models/Customer.js";
import Trip from "../../models/Trip.js";
import { fail, ok } from "../../utils/apiResponse.js";

export const listCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const customers = await Customer.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('name phone email founder loyalty banned banReason createdAt');

    const total = await Customer.countDocuments();

    return ok(res, {
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("listCustomers error:", err);
    return fail(res, "Server error", 500);
  }
};

export const getCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);
    if (!customer) {
      return fail(res, "Customer not found", 404);
    }

    return ok(res, { customer });
  } catch (err) {
    console.error("getCustomer error:", err);
    return fail(res, "Server error", 500);
  }
};

export const getCustomerTrips = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const trips = await Trip.find({ customerId: id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('driverId', 'name phone')
      .select('pickup dropoff fareEstimate distanceKm status createdAt');

    const total = await Trip.countDocuments({ customerId: id });

    return ok(res, {
      trips,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("getCustomerTrips error:", err);
    return fail(res, "Server error", 500);
  }
};

export const getCustomerReferrals = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);
    if (!customer) {
      return fail(res, "Customer not found", 404);
    }

    const referrals = await Customer.find({ "loyalty.referredBy": id })
      .select('name phone email loyalty.tier createdAt');

    return ok(res, { referrals });
  } catch (err) {
    console.error("getCustomerReferrals error:", err);
    return fail(res, "Server error", 500);
  }
};

export const banCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const customer = await Customer.findById(id);
    if (!customer) {
      return fail(res, "Customer not found", 404);
    }

    customer.banned = true;
    customer.banReason = reason;
    await customer.save();

    return ok(res, { customer });
  } catch (err) {
    console.error("banCustomer error:", err);
    return fail(res, "Server error", 500);
  }
};

export const unbanCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findById(id);
    if (!customer) {
      return fail(res, "Customer not found", 404);
    }

    customer.banned = false;
    customer.banReason = null;
    await customer.save();

    return ok(res, { customer });
  } catch (err) {
    console.error("unbanCustomer error:", err);
    return fail(res, "Server error", 500);
  }
};

export const updateLoyaltyTier = async (req, res) => {
  try {
    const { id } = req.params;
    const { tier } = req.body;

    const customer = await Customer.findById(id);
    if (!customer) {
      return fail(res, "Customer not found", 404);
    }

    customer.loyalty = customer.loyalty || {};
    customer.loyalty.tier = tier;
    customer.founder = tier === "founder";
    await customer.save();

    return ok(res, { customer });
  } catch (err) {
    console.error("updateLoyaltyTier error:", err);
    return fail(res, "Server error", 500);
  }
};

export const getCustomerBehaviorLogs = async (req, res) => {
  try {
    const { id } = req.params;
    // For now, return empty array as behavior logs might be in separate collection
    return ok(res, { logs: [] });
  } catch (err) {
    console.error("getCustomerBehaviorLogs error:", err);
    return fail(res, "Server error", 500);
  }
};

export default {
  listCustomers,
  getCustomer,
  getCustomerTrips,
  getCustomerReferrals,
  banCustomer,
  unbanCustomer,
  updateLoyaltyTier,
  getCustomerBehaviorLogs,
};

export const clearCustomerPenalties = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findById(id);
    if (!customer) return fail(res, "Customer not found", 404);

    customer.penalties = {
      cancelCount7Days: 0,
      noShowCount7Days: 0,
      blockedUntil: null,
    };

    await customer.save();

    return ok(res, { customer });
  } catch (err) {
    console.error("clearCustomerPenalties error:", err);
    return fail(res, "Server error", 500);
  }
};