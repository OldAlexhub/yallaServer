import Customer from "../../models/Customer.js";

export const listFounders = async (req, res) => {
  try {
    const founders = await Customer.find({ "loyalty.tier": "founder" })
      .select("name phone loyalty founder createdAt")
      .sort({ createdAt: 1 });

    res.json({ founders });
  } catch (err) {
    console.error("listFounders error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const searchByReferralCode = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) return res.status(400).json({ error: "Referral code is required" });

    const customer = await Customer.findOne({ "loyalty.referralCode": code }).select(
      "name phone loyalty founder"
    );

    if (!customer) return res.status(404).json({ error: "Referral code not found" });

    res.json({ customer });
  } catch (err) {
    console.error("searchByReferralCode error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const adjustCustomerTier = async (req, res) => {
  try {
    const { customerId, tier } = req.body;

    if (!["founder", "regular", "banned"].includes(tier)) {
      return res.status(400).json({ error: "Invalid tier" });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    customer.loyalty.tier = tier;
    customer.founder = tier === "founder";

    // if they become founder and have no code, generate
    if (tier === "founder" && !customer.loyalty.referralCode) {
      const { generateReferralCode } = await import("../../utils/referralCode.js");
      customer.loyalty.referralCode = generateReferralCode();
    }

    await customer.save();

    res.json({
      success: true,
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        founder: customer.founder,
        loyalty: customer.loyalty
      }
    });
  } catch (err) {
    console.error("adjustCustomerTier error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export default { listFounders, searchByReferralCode, adjustCustomerTier };
