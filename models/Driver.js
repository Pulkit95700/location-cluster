import { Schema, model } from "mongoose";

const driverSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export const Driver = model("Driver", driverSchema);
