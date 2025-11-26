import OnboardingControl from "../../models/OnboardingControl.js";
import { fail, ok } from "../../utils/apiResponse.js";

export const getControl = async (req, res) => {
  try {
    let control = await OnboardingControl.findOne();
    if (!control) {
      // Return defaults if document missing
      control = new OnboardingControl();
    }
    return ok(res, control.toObject());
  } catch (err) {
    console.error('getControl error:', err);
    return fail(res, 'Server error', 500);
  }
};

export const updateThreshold = async (req, res) => {
  try {
    const { minTripsThreshold } = req.body;
    if (typeof minTripsThreshold !== 'number' || minTripsThreshold < 0) return fail(res, 'Invalid minTripsThreshold', 400);
    const updated = await OnboardingControl.findOneAndUpdate({}, { minTripsThreshold }, { upsert: true, new: true });
    return ok(res, updated.toObject());
  } catch (err) {
    console.error('updateThreshold error:', err);
    return fail(res, 'Server error', 500);
  }
};

export const toggleOverride = async (req, res) => {
  try {
    const { overrideMode } = req.body;
    if (typeof overrideMode !== 'boolean') return fail(res, 'Invalid overrideMode', 400);
    const updated = await OnboardingControl.findOneAndUpdate({}, { overrideMode }, { upsert: true, new: true });
    return ok(res, updated.toObject());
  } catch (err) {
    console.error('toggleOverride error:', err);
    return fail(res, 'Server error', 500);
  }
};

export const lock = async (req, res) => {
  try {
    const updated = await OnboardingControl.findOneAndUpdate({}, { lockOnboarding: true }, { upsert: true, new: true });
    return ok(res, updated.toObject());
  } catch (err) {
    console.error('lock error:', err);
    return fail(res, 'Server error', 500);
  }
};

export const unlock = async (req, res) => {
  try {
    const updated = await OnboardingControl.findOneAndUpdate({}, { lockOnboarding: false }, { upsert: true, new: true });
    return ok(res, updated.toObject());
  } catch (err) {
    console.error('unlock error:', err);
    return fail(res, 'Server error', 500);
  }
};

export default { getControl, updateThreshold, toggleOverride, lock, unlock };
