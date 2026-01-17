import mongoose from "mongoose";
import { Env } from "./env.config";

const connectDatabase = async () => {
    try {
        await mongoose.connect(Env.MONGO_URI, {
            serverSelectionTimeoutMS: 8000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
        });
        console.log("MongoDB connected successfully");
    }   catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
};

export default connectDatabase;