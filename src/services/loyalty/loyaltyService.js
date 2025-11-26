import Customer from "../../models/Customer.js";
import FounderLimit from "../../models/FounderLimit.js";
import { generateReferralCode } from "../../utils/referralCode.js";

export const assignLoyaltyTierOnSignup = async (customer, referralCodeInput) => {
  // dynamic founder cutoff, default 10000
  const founderLimitDoc = await FounderLimit.findOne();
  const founderLimit = founderLimitDoc ? founderLimitDoc.limit : 10000;

  const totalCustomers = await Customer.countDocuments();

  let tier = totalCustomers <= founderLimit ? "founder" : "regular";
  let referredBy = null;

  if (referralCodeInput) {
    const inviter = await Customer.findOne({
      "loyalty.referralCode": referralCodeInput,
      "loyalty.tier": "founder"
    });

    if (inviter) {
      // Grandfathering: referrals of founders are founders even above limit
      tier = "founder";
      referredBy = inviter._id;

      inviter.loyalty.referralCount = (inviter.loyalty.referralCount || 0) + 1;
      await inviter.save();
    }
  }

  customer.loyalty = customer.loyalty || {};
  customer.loyalty.tier = tier;
  customer.loyalty.referredBy = referredBy || null;

  // sync legacy flag
  customer.founder = tier === "founder";
  customer.banned = false; // Ensure not banned

  if (tier === "founder" && !customer.loyalty.referralCode) {
    // ensure unique code
    let code = generateReferralCode();
    let exists = await Customer.findOne({ "loyalty.referralCode": code });
    let attempts = 0;
    while (exists && attempts < 5) {
      code = generateReferralCode();
      exists = await Customer.findOne({ "loyalty.referralCode": code });
      attempts++;
    }
    customer.loyalty.referralCode = code;
  }

  await customer.save();
  return customer;
};

export default { assignLoyaltyTierOnSignup };
