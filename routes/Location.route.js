import { Router } from "express";
import {
    getHotspots,
    calculateDistanceTravelledInADay,
    getRandomPoints,
    createDriver,
    getAllDrivers,
    addLocation
} from "../controllers/Location.controller.js";

const router = Router();

router.get("/get-hotspots", getHotspots);
router.get("/calculate-distance", calculateDistanceTravelledInADay);
router.get("/random-points", getRandomPoints);
router.post("/create-driver", createDriver);
router.get("/all-drivers", getAllDrivers);
router.post("/add-location", addLocation);

export default router;
