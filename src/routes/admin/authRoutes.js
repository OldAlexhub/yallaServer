import express from "express";
import { adminLogin, adminLogout, adminMe } from "../../controllers/admin/authController.js";
import { adminAuth } from "../../middleware/adminAuth.js";

const router = express.Router();

router.post("/login", adminLogin);
router.get("/me", adminAuth, adminMe);
router.post("/logout", adminAuth, adminLogout);

export default router;
