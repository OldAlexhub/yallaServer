import express from "express";
import { fetchAnnouncements, markAnnouncementRead } from "../../controllers/shared/announcementFetchController.js";
import { customerAuth } from "../../middleware/customerAuth.js";
import { injectCustomerUser } from "../../middleware/userTypeInjector.js";

const router = express.Router();

router.get("/list", customerAuth, injectCustomerUser, fetchAnnouncements);
router.post("/read", customerAuth, injectCustomerUser, markAnnouncementRead);

export default router;
