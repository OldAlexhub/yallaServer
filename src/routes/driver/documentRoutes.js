import express from "express";
import { updateDriverDocuments } from "../../controllers/driver/documentController.js";
import { driverAuth } from "../../middleware/driverAuth.js";

const router = express.Router();

router.put("/documents", driverAuth, updateDriverDocuments);

export default router;
