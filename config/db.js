import mongoose from "mongoose";

const DB_NAME = "LocationDB";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGODB_URI}/${DB_NAME}`
        );

        console.log(
            `\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`
        );
    } catch (err) {
        console.log("MongoDB connection failed ", err);
        process.exit(1);
    }
};

export { connectDB };