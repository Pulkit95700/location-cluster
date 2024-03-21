import axios from "axios";
import mongoose from "mongoose";
import haversine from "haversine-distance";
import clustering from "density-clustering";

const generateClusters = (locationData) => {
    const points = locationData.map((location) => [
        location.latitude,
        location.longitude,
    ]);

    const dbscan = new clustering.DBSCAN();
    // neighborhood radius = 0.01, minimum number of points = 4
    // the change will be equal to distance 1.1 km

    let clusters = dbscan.run(points, 0.01, 4);

    clusters = clusters.map((cluster) => {
        const clusterPoints = cluster.map((pointIndex) => {
            return points[pointIndex];
        });

        const clusterCenter = clusterPoints.reduce(
            (acc, point) => {
                acc.latitude += point[0];
                acc.longitude += point[1];
                return acc;
            },
            { latitude: 0, longitude: 0 }
        );

        clusterCenter.latitude /= clusterPoints.length;
        clusterCenter.longitude /= clusterPoints.length;

        return {
            center: clusterCenter,
            points: clusterPoints,
        };
    });

    clusters = clusters.sort((a, b) => b.points.length - a.points.length);

    return clusters;
};

const getBoundingCoordinates = async (city, state) => {
    try {
        const response = await axios.get(
            `${process.env.NOMINATIM_URL}/search?city=${city}&state=${state}&format=json`
        );

        return response.data?.[0].boundingbox;
    } catch (err) {
        console.log("Error in getBoundingCoordinates", err);
    }
};

const generateRandomPoints = (boundingCoordinates, date, driverId) => {
    const [south, north, west, east] = boundingCoordinates;

    const randomPoints = [];

    for (let i = 0; i < 10; i++) {
        const latitude =
            parseFloat(south) +
            Math.random() * (parseFloat(north) - parseFloat(south));
        const longitude =
            parseFloat(west) +
            Math.random() * (parseFloat(east) - parseFloat(west));

        randomPoints.push({
            latitude,
            longitude,
            // convert the date to timestamp and set the hours to the current iteration
            createdAt: new Date(new Date(date).setHours(i)),
            driver: driverId,
        });
    }

    return randomPoints;
};

const calculateTotalDistance = (locationData) => {
    let distance = 0;

    for (let i = 0; i < locationData.length - 1; i++) {
        const start = {
            latitude: locationData[i].latitude,
            longitude: locationData[i].longitude,
        };

        const end = {
            latitude: locationData[i + 1].latitude,
            longitude: locationData[i + 1].longitude,
        };

        distance += haversine(start, end, { unit: "meter" });
    }

    return distance;
};

export {
    getBoundingCoordinates,
    generateRandomPoints,
    calculateTotalDistance,
    generateClusters,
};
