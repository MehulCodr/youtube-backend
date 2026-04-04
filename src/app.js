import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true

}))

app.use(express.json({limit : "16kb"}))
app.use(express.urlencoded({extended: true,limit : "16kb"}))
app.use(express.static("public"))
app.use(cookieParser());

// Debug endpoint
app.get("/debug/env", (req, res) => {
    res.json({
        CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET
    });
});

//router imports
import userRouter from "./routes/user.routes.js";

//routes declaration
app.use("/api/v1/users", userRouter);

export { app };