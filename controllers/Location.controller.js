import mongoose from "mongoose";
import {
    calculateTotalDistance,
    generateClusters,
    generateRandomPoints,
    getBoundingCoordinates,
} from "../utils/Location.utils.js";
import { Location } from "../models/Location.js";
import { Driver } from "../models/Driver.js";

export const getHotspots = async (req, res) => {
    try {
        let { city, state, date, radius = 10 } = req.query;

        if (!city || !state || !date)
            return res
                .status(400)
                .json({ message: "City, state and date are required" });

        radius = parseInt(radius) * 1000;

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

        const locationData = await Location.aggregate([
            {
                $match: {
                    latitude: {
                        $gte: boundingCoordinates[0],
                        $lte: boundingCoordinates[1],
                    },
                    longitude: {
                        $gte: boundingCoordinates[2],
                        $lte: boundingCoordinates[3],
                    },
                    createdAt: {
                        $gte: startDate,
                        $lte: endDate,
                    },
                },
            },
        ]);

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

        const locationData = await Location.aggregate([
            {
                $match: {
                    driver: new mongoose.Types.ObjectId(driverId),
                    createdAt: {
                        $gte: startDate,
                        $lte: endDate,
                    },
                },
            },
            {
                $sort: {
                    createdAt: 1,
                },
            },
        ]);

        if (locationData.length < 2) {
            return res.status(200).json({ distance: 0 });
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

        const boundingCoordinates = await getBoundingCoordinates(city, state);
        const randomPoints = generateRandomPoints(
            boundingCoordinates,
            date,
            driverId
        );

        await Location.insertMany(randomPoints);
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

        const driver = new Driver({ name });
        await driver.save();
        res.status(201).json(driver);
    } catch (err) {
        console.log("Error in createDriver", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getAllDrivers = async (req, res) => {
    try {
        const drivers = await Driver.find();
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

        if(isNaN(latitude) || isNaN(longitude))
            return res.status(400).json({ message: "Invalid latitude or longitude" });

        const driver = await Driver.findById(driverId);
        if (!driver)
            return res.status(400).json({ message: "Invalid driverId" });

        const location = new Location({
            latitude,
            longitude,
            driver: driverId,
        });

        await location.save();
        res.status(201).json(location);
    } catch (err) {
        console.log("Error in addLocation", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
