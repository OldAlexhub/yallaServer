import CustomerDiscounts from "../../models/CustomerDiscounts.js";
import { fail, ok } from "../../utils/apiResponse.js";

export const getCustomerDiscounts = async (req, res) => {
  try {
    let doc = await CustomerDiscounts.findOne();
    if (!doc) doc = new CustomerDiscounts();
    return ok(res, { customerDiscounts: doc.toObject() });
  } catch (err) {
    console.error('getCustomerDiscounts error:', err);
    return fail(res, 'Server error', 500);
  }
};

export const updateCustomerDiscounts = async (req, res) => {
  try {
    const { founderDiscountPercentage, regularDiscountPercentage } = req.body;
    if (typeof founderDiscountPercentage !== 'number' || founderDiscountPercentage < 0 || founderDiscountPercentage > 100) return fail(res, 'Invalid founderDiscountPercentage', 400);
    if (typeof regularDiscountPercentage !== 'number' || regularDiscountPercentage < 0 || regularDiscountPercentage > 100) return fail(res, 'Invalid regularDiscountPercentage', 400);

    const updated = await CustomerDiscounts.findOneAndUpdate({}, { founderDiscountPercentage, regularDiscountPercentage }, { upsert: true, new: true });
    return ok(res, { customerDiscounts: updated.toObject() });
  } catch (err) {
    console.error('updateCustomerDiscounts error:', err);
    return fail(res, 'Server error', 500);
  }
};

export default { getCustomerDiscounts, updateCustomerDiscounts };
