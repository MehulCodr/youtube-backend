// require("dotenv").config(path : "./.env");
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: `${__dirname}/../.env` });

// Initialize Cloudinary after env vars are loaded
import { initializeCloudinary } from "./utils/cloudinary.js";
initializeCloudinary();

import { app } from "./app.js";
import connectDB from "./db/index.js";

connectDB().then(() => {
    app.on("error", (error) => {
        console.log("Error: " , error);
        throw error;
    })
    app.listen(process.env.PORT || 8000, () => {
        console.log("server is running at PORT ", process.env.PORT || 8000);
    })
}).catch((err) => {
    console.log("MONGO DB connection failed!! ", err);
})
















/*
import express from "express"
const app = express()

(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("Error : ",error);
            throw error;
        });

        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        });
    }
    catch (error){
        console.log(error);
        throw error;
    }
})();

*/