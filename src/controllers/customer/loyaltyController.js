import Customer from "../../models/Customer.js";
import CustomerDiscounts from "../../models/CustomerDiscounts.js";
import Trip from "../../models/Trip.js";

export const getLoyaltyStatus = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer.id).select("loyalty founder");
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    // decide discount percent based on customer founder status
    const customerDiscounts = await CustomerDiscounts.findOne();
    const founderDiscount = customerDiscounts?.founderDiscountPercentage ?? 20;
    const regularDiscount = customerDiscounts?.regularDiscountPercentage ?? 0;
    const discountPercent = customer.founder ? founderDiscount : regularDiscount;

    // compute total savings across completed trips (prefer discountAmount field when present)
    try {
      const trips = await Trip.find({ customerId: customer._id, status: 'completed' }).select('fareEstimate fare discountAmount');
      let totalSaved = 0;
      for (const t of trips) {
        if (typeof t.discountAmount === 'number' && t.discountAmount > 0) {
          totalSaved += t.discountAmount;
        } else if (typeof t.fareEstimate === 'number' && typeof t.fare === 'number') {
          totalSaved += Math.max(0, t.fareEstimate - t.fare);
        }
      }
      totalSaved = Math.round((totalSaved + Number.EPSILON) * 100) / 100;
      res.json({ founder: customer.founder, loyalty: customer.loyalty, discountPercent, totalSaved });
    } catch (err) {
      console.error('Error calculating totalSaved for loyalty status', err);
      res.json({ founder: customer.founder, loyalty: customer.loyalty, discountPercent, totalSaved: 0 });
    }
  } catch (err) {
    console.error("getLoyaltyStatus error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export default { getLoyaltyStatus };
