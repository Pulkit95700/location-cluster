import { Schema, model } from "mongoose";

const locationSchema = new Schema({
    latitude: {
        type: Number,
        required: true,
    },
    longitude: {
        type: Number,
        required: true,
    },

    driver: {
        type: Schema.Types.ObjectId,
        ref: "Driver",
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
});

export const Location = model("Location", locationSchema);
