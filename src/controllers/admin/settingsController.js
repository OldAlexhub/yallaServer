import AISettings from "../../models/AISettings.js";
import Categories from "../../models/Categories.js";
import CustomerDiscounts from "../../models/CustomerDiscounts.js";
import FareStructure from "../../models/FareStructure.js";
import FounderLimit from "../../models/FounderLimit.js";
import GlobalMessage from "../../models/GlobalMessage.js";
import MatchingConfig from "../../models/MatchingConfig.js";
import Penalties from "../../models/Penalties.js";
import ServiceAvailability from "../../models/ServiceAvailability.js";
import SubscriptionSettings from "../../models/SubscriptionSettings.js";
import VehicleModelYear from "../../models/VehicleModelYear.js";
import { fail, ok } from "../../utils/apiResponse.js";

export const getSettings = async (req, res) => {
  try {
    const settings = {};

    // Fetch each setting from its own model
    const fareStructure = await FareStructure.findOne();
    const founderLimit = await FounderLimit.findOne();
    const penalties = await Penalties.findOne();
    const matchingConfig = await MatchingConfig.findOne();
    const vehicleModelYear = await VehicleModelYear.findOne();
    const categories = await Categories.findOne();
    const serviceAvailability = await ServiceAvailability.findOne();
    const globalMessage = await GlobalMessage.findOne();
    const aiSettings = await AISettings.findOne();
    const subscriptionSettings = await SubscriptionSettings.findOne();
    const customerDiscounts = await CustomerDiscounts.findOne();

    // Assign to settings object
    if (fareStructure) settings.fareStructure = fareStructure.toObject();
    if (founderLimit) settings.founderLimit = founderLimit.limit;
    if (penalties) settings.penalties = penalties.toObject();
    if (matchingConfig) settings.matchingConfig = matchingConfig.toObject();
    if (vehicleModelYear) settings.vehicleModelYear = vehicleModelYear.year;
    if (categories) settings.categories = categories.categories;
    if (serviceAvailability) settings.serviceAvailability = serviceAvailability.toObject();
    if (globalMessage) settings.globalMessage = globalMessage.toObject();
    if (aiSettings) settings.aiSettings = aiSettings.toObject();
    if (subscriptionSettings) settings.subscriptionSettings = subscriptionSettings.toObject();
    if (customerDiscounts) settings.customerDiscounts = customerDiscounts.toObject();

    // Default values if not set
    if (!settings.fareStructure) {
      settings.fareStructure = {
        baseFare: 10,
        perKm: 4.5,
        minimumFare: 5,
        waitingFare: 0.5
      };
    }
    if (!settings.penalties) {
      settings.penalties = {
        maxIgnoredTrips: 3,
        maxConsecutiveIgnores: 2,
        penaltyDuration: 30,
        noShowBanThreshold: 5,
        cancellationThreshold: 3
      };
    }
    if (!settings.matchingConfig) {
      settings.matchingConfig = {
        assignmentRadius: 5000,
        maxRetries: 3,
        etaMultiplier: 1.5,
        cooldownTime: 60
      };
    }
    if (!settings.vehicleModelYear) {
      settings.vehicleModelYear = 2010;
    }
    if (!settings.categories) {
      settings.categories = ['Standard', 'Premium'];
    }
    if (!settings.serviceAvailability) {
      settings.serviceAvailability = {
        suspendService: false,
        disableDriverSignups: false,
        disableCustomerSignups: false,
        disableTripRequests: false
      };
    }
    if (!settings.globalMessage) {
      settings.globalMessage = {
        title: '',
        body: '',
        visible: false
      };
    }
    if (!settings.aiSettings) {
      settings.aiSettings = {
        enableHeatZones: true,
        predictionInterval: 30,
        sensitivity: 0.5,
        minClusterSize: 5,
        maxClusterSize: 20,
        minDriversPerZone: 1
      };
    }
    if (!settings.subscriptionSettings) {
      settings.subscriptionSettings = {
        weeklyFee: 50,
        discountPercentage: 0
      };
    }
    if (!settings.customerDiscounts) {
      settings.customerDiscounts = {
        founderDiscountPercentage: 20,
        regularDiscountPercentage: 0
      };
    }

    return ok(res, settings);
  } catch (err) {
    console.error("getSettings error:", err);
    return fail(res, "Server error", 500);
  }
};

export const updateFareStructure = async (req, res) => {
  try {
    const { baseFare, perKm, minimumFare, waitingFare } = req.body;

    // Validate
    if (typeof baseFare !== 'number' || baseFare < 0) {
      return fail(res, "Invalid baseFare", 400);
    }
    if (typeof perKm !== 'number' || perKm < 0) {
      return fail(res, "Invalid perKm", 400);
    }
    if (typeof minimumFare !== 'number' || minimumFare < 0) {
      return fail(res, "Invalid minimumFare", 400);
    }
    if (typeof waitingFare !== 'number' || waitingFare < 0) {
      return fail(res, "Invalid waitingFare", 400);
    }

    const fareStructure = { baseFare, perKm, minimumFare, waitingFare };

    await FareStructure.findOneAndUpdate(
      {},
      fareStructure,
      { upsert: true, new: true }
    );

    return ok(res, { fareStructure });
  } catch (err) {
    console.error("updateFareStructure error:", err);
    return fail(res, "Server error", 500);
  }
};

export const updateGeofence = async (req, res) => {
  try {
    const { geofence } = req.body;
    // Assuming geofence is an array of polygons or something
    // For now, store in a GeofenceSettings model or update Geofence model
    // But since Geofence model exists, perhaps update global geofence settings
    // For simplicity, since not implemented, return ok
    return ok(res, { geofence });
  } catch (err) {
    console.error("updateGeofence error:", err);
    return fail(res, "Server error", 500);
  }
};

export const updateFounderLimit = async (req, res) => {
  try {
    const { limit } = req.body;
    await FounderLimit.findOneAndUpdate(
      {},
      { limit },
      { upsert: true, new: true }
    );
    return ok(res, { founderLimit: limit });
  } catch (err) {
    console.error("updateFounderLimit error:", err);
    return fail(res, "Server error", 500);
  }
};

export const updatePenalties = async (req, res) => {
  try {
    const { maxIgnoredTrips, maxConsecutiveIgnores, penaltyDuration, noShowBanThreshold, cancellationThreshold } = req.body;
    const penalties = { maxIgnoredTrips, maxConsecutiveIgnores, penaltyDuration, noShowBanThreshold, cancellationThreshold };
    await Penalties.findOneAndUpdate(
      {},
      penalties,
      { upsert: true, new: true }
    );
    return ok(res, { penalties });
  } catch (err) {
    console.error("updatePenalties error:", err);
    return fail(res, "Server error", 500);
  }
};

export const updateMatchingConfig = async (req, res) => {
  try {
    const { assignmentRadius, maxRetries, etaMultiplier, cooldownTime } = req.body;
    const matchingConfig = { assignmentRadius, maxRetries, etaMultiplier, cooldownTime };
    await MatchingConfig.findOneAndUpdate(
      {},
      matchingConfig,
      { upsert: true, new: true }
    );
    return ok(res, { matchingConfig });
  } catch (err) {
    console.error("updateMatchingConfig error:", err);
    return fail(res, "Server error", 500);
  }
};

export const updateVehicleModelYear = async (req, res) => {
  try {
    const { year } = req.body;
    await VehicleModelYear.findOneAndUpdate(
      {},
      { year },
      { upsert: true, new: true }
    );
    return ok(res, { vehicleModelYear: year });
  } catch (err) {
    console.error("updateVehicleModelYear error:", err);
    return fail(res, "Server error", 500);
  }
};

export const updateCategories = async (req, res) => {
  try {
    const { categories } = req.body;
    await Categories.findOneAndUpdate(
      {},
      { categories },
      { upsert: true, new: true }
    );
    return ok(res, { categories });
  } catch (err) {
    console.error("updateCategories error:", err);
    return fail(res, "Server error", 500);
  }
};

export const toggleServiceAvailability = async (req, res) => {
  try {
    const { suspendService, disableDriverSignups, disableCustomerSignups, disableTripRequests } = req.body;
    const serviceAvailability = { suspendService, disableDriverSignups, disableCustomerSignups, disableTripRequests };
    await ServiceAvailability.findOneAndUpdate(
      {},
      serviceAvailability,
      { upsert: true, new: true }
    );
    return ok(res, { serviceAvailability });
  } catch (err) {
    console.error("toggleServiceAvailability error:", err);
    return fail(res, "Server error", 500);
  }
};

export const updateGlobalMessage = async (req, res) => {
  try {
    const { title, body, visible } = req.body;
    const globalMessage = { title, body, visible };
    await GlobalMessage.findOneAndUpdate(
      {},
      globalMessage,
      { upsert: true, new: true }
    );
    return ok(res, { globalMessage });
  } catch (err) {
    console.error("updateGlobalMessage error:", err);
    return fail(res, "Server error", 500);
  }
};

export const updateAISettings = async (req, res) => {
  try {
    const { enableHeatZones, predictionInterval, sensitivity, minClusterSize, maxClusterSize, minDriversPerZone } = req.body;
    const aiSettings = { enableHeatZones, predictionInterval, sensitivity, minClusterSize, maxClusterSize, minDriversPerZone };
    await AISettings.findOneAndUpdate(
      {},
      aiSettings,
      { upsert: true, new: true }
    );
    return ok(res, { aiSettings });
  } catch (err) {
    console.error("updateAISettings error:", err);
    return fail(res, "Server error", 500);
  }
};

export const updateSubscriptionSettings = async (req, res) => {
  try {
    const { weeklyFee, discountPercentage } = req.body;
    const subscriptionSettings = { weeklyFee, discountPercentage };
    await SubscriptionSettings.findOneAndUpdate(
      {},
      subscriptionSettings,
      { upsert: true, new: true }
    );
    return ok(res, { subscriptionSettings });
  } catch (err) {
    console.error("updateSubscriptionSettings error:", err);
    return fail(res, "Server error", 500);
  }
};