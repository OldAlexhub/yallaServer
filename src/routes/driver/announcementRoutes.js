import express from "express";
import { fetchAnnouncements, markAnnouncementRead } from "../../controllers/shared/announcementFetchController.js";
import { driverAuth } from "../../middleware/driverAuth.js";
import { injectDriverUser } from "../../middleware/userTypeInjector.js";

const router = express.Router();

router.get("/list", driverAuth, injectDriverUser, fetchAnnouncements);
router.post("/read", driverAuth, injectDriverUser, markAnnouncementRead);

export default router;
