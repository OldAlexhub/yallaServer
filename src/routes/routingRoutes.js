import express from "express";
import { getRouteHandler } from "../controllers/routingController.js";

const router = express.Router();

// GET /routing/route?fromLat=&fromLng=&toLat=&toLng=
router.get("/route", getRouteHandler);

export default router;
