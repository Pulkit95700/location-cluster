import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";
import { connectDB } from "./config/db.js";
import LocationRouter from "./routes/Location.route.js";
import { Location } from "./models/Location.js";

dotenv.config();

const app = express();
app.use(express.json());
const allowedOrigins = [
    process.env.CORS_ORIGIN,
    "http://localhost:3000",
    "http://localhost:5173",
];

app.use(
    cors({
        origin: function (origin, callback) {
            if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
                // !origin allows for localhost
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
    })
);

// using the app

app.use("/api/v1", LocationRouter);

connectDB().then(() => {
    // socket.io if we want to get the realtime data from frontend.
    const server = http.createServer(app);

    let io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        console.log("a user connected");

        socket.on("location", async (location) => {
            const { latitude, longitude, driverId } = location;
            if (!latitude || !longitude || !driverId) return;

            try {
                await Location.create({
                    latitude,
                    longitude,
                    driver: driverId,
                });
            } catch (err) {
                console.log("Error in addLocation", err);
            }
        });

        socket.on("disconnect", () => {
            console.log("user disconnected", socket.id);
        });
    });

    server.listen(process.env.PORT, () => {
        console.log(`🔎 Server running on port ${process.env.PORT}`);
    });
});
