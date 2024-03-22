import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import LocationRouter from "./routes/Location.route.js";

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

app.listen(process.env.PORT, () => {
    console.log(`🔎 Server running on port ${process.env.PORT}`);
});