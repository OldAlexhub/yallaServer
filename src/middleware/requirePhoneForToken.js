import { fail } from "../utils/apiResponse.js";
import { isValidPhoneEgypt } from "../utils/validators.js";

export default function requirePhoneForToken(req, res, next) {
  const phone = req.body && req.body.phone;
  if (!phone) {
    return fail(res, "Phone required to issue token", 400, { code: "MISSING_FIELDS", fields: ["phone"] });
  }

  if (!isValidPhoneEgypt(phone)) {
    return fail(res, "Invalid phone format", 400, { code: "INVALID_PHONE" });
  }

  return next();
}
