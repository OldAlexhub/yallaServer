import Driver from '../../models/Driver.js';
import DriverOtp from '../../models/DriverOtp.js';
import { fail, ok } from '../../utils/apiResponse.js';
import { isValidPhoneEgypt } from '../../utils/validators.js';

function makeCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export const sendOtp = async (req, res) => {
  try {
    const { phone, purpose } = req.body;
    if (!phone || !isValidPhoneEgypt(phone)) return fail(res, 'Invalid phone', 400);

    const code = makeCode();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes

    await DriverOtp.create({ phone, code, purpose: purpose || 'verify', expiresAt });

    // Best-effort: send via SMS provider here. For now we log to server logs
    console.log(`OTP for ${phone} [${purpose || 'verify'}]: ${code}`);

    return ok(res, { message: 'OTP sent (simulated)' });
  } catch (err) {
    console.error('sendOtp error', err);
    return fail(res, 'Server error', 500);
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp, purpose } = req.body;
    if (!phone || !otp) return fail(res, 'Missing params', 400);

    const record = await DriverOtp.findOne({ phone, code: otp, purpose: purpose || 'verify' }).sort({ createdAt: -1 });
    if (!record) return fail(res, 'Invalid code', 400);
    if (record.expiresAt < new Date()) return fail(res, 'Code expired', 400);

    // consume the code
    await DriverOtp.deleteMany({ phone, purpose: purpose || 'verify' });

    return ok(res, { message: 'Verified' });
  } catch (err) {
    console.error('verifyOtp error', err);
    return fail(res, 'Server error', 500);
  }
};

export const requestPasswordReset = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !isValidPhoneEgypt(phone)) return fail(res, 'Invalid phone', 400);

    const driver = await Driver.findOne({ phone });
    if (!driver) return fail(res, 'Driver not found', 404);

    const code = makeCode();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 10);

    await DriverOtp.create({ phone, code, purpose: 'reset', expiresAt });
    console.log(`Password reset OTP for ${phone}: ${code}`);

    return ok(res, { message: 'Reset code sent (simulated)' });
  } catch (err) {
    console.error('requestPasswordReset error', err);
    return fail(res, 'Server error', 500);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { phone, code, password } = req.body;
    if (!phone || !code || !password) return fail(res, 'Missing fields', 400);

    const record = await DriverOtp.findOne({ phone, code, purpose: 'reset' }).sort({ createdAt: -1 });
    if (!record) return fail(res, 'Invalid code', 400);
    if (record.expiresAt < new Date()) return fail(res, 'Code expired', 400);

    const driver = await Driver.findOne({ phone });
    if (!driver) return fail(res, 'Driver not found', 404);

    // update password
    import('bcryptjs').then(async ({ default: bcrypt }) => {
      const hash = await bcrypt.hash(password, 10);
      driver.passwordHash = hash;
      await driver.save();
      await DriverOtp.deleteMany({ phone, purpose: 'reset' });
      return ok(res, { message: 'Password reset' });
    }).catch((err) => {
      console.error('bcrypt import error', err);
      return fail(res, 'Server error', 500);
    });
  } catch (err) {
    console.error('resetPassword error', err);
    return fail(res, 'Server error', 500);
  }
};
