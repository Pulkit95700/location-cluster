import {
    calculateTotalDistance,
    generateClusters,
    generateRandomPoints,
    getBoundingCoordinates,
} from "../utils/Location.utils.js";
import Location from "../models/Location.js";
import Driver from "../models/Driver.js";
import { db } from "../config/firebase.js";

export const getHotspots = async (req, res) => {
    try {
        let { city, state, date } = req.query;

        if (!city || !state || !date)
            return res
                .status(400)
                .json({ message: "City, state and date are required" });

        const startDate = new Date(date);
        const endDate = new Date(date + "T23:59:59");

        if (startDate == "Invalid Date" || endDate == "Invalid Date")
            return res.status(400).json({ message: "Invalid date" });

        let boundingCoordinates = await getBoundingCoordinates(city, state);
        if (!boundingCoordinates)
            return res.status(400).json({ message: "Invalid city or state" });

        // parsing them to float
        boundingCoordinates = boundingCoordinates.map((coordinate) =>
            parseFloat(coordinate)
        );

        let locationData = await db
            .collection("locations")
            .where("createdAt", ">=", startDate)
            .where("createdAt", "<=", endDate)
            .get();

        locationData = locationData.docs.map((doc) => doc.data());
        // using the dbscan algorithm to generate clusters
        let clusters = generateClusters(locationData);

        res.status(200).json(clusters);
    } catch (err) {
        console.log("Error in getHotspots", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const calculateDistanceTravelledInADay = async (req, res) => {
    try {
        const { driverId = undefined, date = Date.now() } = req.query;
        // get the driver's location data for the given date
        // calculate the distance travelled
        // send the response
        if (!driverId)
            return res.status(400).json({ message: "Driver ID is required" });

        const startDate = new Date(date);
        const endDate = new Date(date + "T23:59:59");

        if (startDate == "Invalid Date" || endDate == "Invalid Date")
            return res.status(400).json({ message: "Invalid date" });

        // check if the driver exists
        let driver = await db.collection("drivers").doc(driverId).get();
        if (!driver.exists)
            return res.status(400).json({ message: "Invalid driverId" });

        let locationData = await db
            .collection("locations")
            .where("driverId", "==", driverId)
            .where("createdAt", ">=", startDate)
            .where("createdAt", "<=", endDate)
            .orderBy("createdAt", "asc")
            .get();

        locationData = locationData.docs.map((doc) => doc.data());
        if (locationData.length < 2) {
            return res.status(200).json({ distance: 0, unit: "meters" });
        }

        let distance = calculateTotalDistance(locationData);

        res.status(200).json({
            totalDistance: distance,
            unit: "meters",
        });
    } catch (err) {
        console.log("Error in calculateDistanceTravelledInADay", err);
        res.status(500).json({ message: err });
    }
};

export const getRandomPoints = async (req, res) => {
    try {
        let { city, state, date, driverId } = req.query;

        if (!city || !state || !date || !driverId)
            return res.status(400).json({
                message: "City, state, date and driverId are required",
            });

        date = new Date(date);
        if (date == "Invalid Date")
            return res.status(400).json({ message: "Invalid date" });

        let driver = await db.collection("drivers").doc(driverId).get();
        if (!driver.exists)
            return res.status(400).json({ message: "Invalid driverId" });

        let locationsRef = db.collection("locations");

        const boundingCoordinates = await getBoundingCoordinates(city, state);
        const randomPoints = generateRandomPoints(
            boundingCoordinates,
            date,
            driverId
        );

        // console.log("Random Points", randomPoints);
        randomPoints.forEach(async (point) => {
            console.log("Point", point);
            await locationsRef.add(point);
        });

        res.status(200).json(randomPoints);
    } catch (err) {
        console.log("Error in getRandomPoints", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const createDriver = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) return res.status(400).json({ message: "Name is required" });

        const driver = new Driver(name);

        let driverObj = driver.toJSON();
        let driverRef = await db.collection("drivers").add(driverObj);

        driverObj.id = driverRef.id;
        res.status(201).json(driverObj);
    } catch (err) {
        console.log("Error in createDriver", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getAllDrivers = async (req, res) => {
    try {
        let drivers = [];
        const driversRef = await db.collection("drivers").get();

        driversRef.forEach((doc) => {
            drivers.push({ id: doc.id, ...doc.data() });
        });

        res.status(200).json(drivers);
    } catch (err) {
        console.log("Error in getAllDrivers", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const addLocation = async (req, res) => {
    try {
        let { latitude, longitude, driverId } = req.body;

        if (!latitude || !longitude || !driverId)
            return res.status(400).json({
                message: "Latitude, longitude and driverId are required",
            });

        latitude = parseFloat(latitude);
        longitude = parseFloat(longitude);

        if (isNaN(latitude) || isNaN(longitude))
            return res
                .status(400)
                .json({ message: "Invalid latitude or longitude" });

        let driver = await db.collection("drivers").doc(driverId).get();
        if (!driver.exists)
            return res.status(400).json({ message: "Invalid driverId" });

        const location = new Location(latitude, longitude, driverId);

        let locationObj = location.toJSON();

        let locationRef = await db.collection("locations").add(locationObj);
        locationObj.id = locationRef.id;

        res.status(201).json(locationObj);
    } catch (err) {
        console.log("Error in addLocation", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
