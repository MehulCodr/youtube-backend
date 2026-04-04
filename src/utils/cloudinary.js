import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Initialize Cloudinary configuration
const initializeCloudinary = () => {
    const config = {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    };
    
    if (!config.api_key || !config.cloud_name || !config.api_secret) {
        console.warn("Cloudinary configuration incomplete:", {
            cloud_name: !!config.cloud_name,
            api_key: !!config.api_key,
            api_secret: !!config.api_secret
        });
    }
    
    cloudinary.config(config);
    return config;
};

const uploadToCloudinary = async (filePath) => {
    try {
        if (!filePath) return null;

        // Re-initialize to ensure config is fresh
        initializeCloudinary();

        const result = await cloudinary.uploader.upload(filePath, {
            resource_type: "auto",
        });
        fs.unlinkSync(filePath);
        return result;
    } catch (error) {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        console.error("Error uploading to Cloudinary:", error.message);
        throw error;
    }
};

export { uploadToCloudinary, initializeCloudinary };