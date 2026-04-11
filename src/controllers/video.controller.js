import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    //pagination : skip = (page - 1) * limit, limit = limit
    //sort : sort = { [sortBy] : sortType === "asc" ? 1 : -1 }
    //query : { title : { $regex : query, $options : "i" } }
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);


    if (!userId) {
        throw new ApiError(400, "User id is required");
    }
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    const allowedSortFields = ["createdAt", "title", "views"];

    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const sortOrder = sortType === "asc" ? 1 : -1;
    const filter = {
        ...(query && { title: { $regex: query, $options: "i" } }),//... is used to conditionally add the title filter only if the query parameter is present in the request
        //if query is not regular expression then we can simply do this : title : query
        author: new mongoose.Types.ObjectId(userId)
    };
    const videos = await Video.find(filter).skip((pageNum - 1) * limitNum).limit(limitNum).sort({ [sortField]: sortOrder }).populate("author", "username fullname");

    return res
        .status(200)
        .json(new ApiResponse(200, "Videos fetched successfully", videos))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video
    if (!title?.trim()) {
        throw new ApiError(400, "Title is required");
    }
    if (!description?.trim()) {
        throw new ApiError(400, "Description is required");
    }
    if (req.files?.videoFile?.[0]?.mimetype.split("/")[0] !== "video") {
        throw new ApiError(400, "Invalid video file");
    }
    if (!thumbnailFile || thumbnailFile.mimetype.split("/")[0] !== "image") {
        throw new ApiError(400, "Valid thumbnail is required");
    }
    const video = await uploadOnCloudinary(req.files?.videoFile?.[0]?.path, "video");
    const thumbnail = await uploadOnCloudinary(req.files?.thumbnail?.[0]?.path, "image");
    if (!video || !thumbnail) {
        throw new ApiError(500, "File upload failed");
    }
    const thumbnailFile = req.files?.thumbnail?.[0];

    const createdVideo = await Video.create({
        title,
        description,
        videoFile: video.secure_url,
        thumbnail: thumbnail.secure_url,
        author: new mongoose.Types.ObjectId(req.user._id),
        duration: video.duration,
        // .duration is provided by cloudinary in seconds
        isPublished: true
    });

    return res
        .status(201)
        .json(new ApiResponse(201, "Video published successfully", createdVideo))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }
    const video = await Video.findById(videoId).populate("author", "username fullname");
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, "Video fetched successfully", video))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    //check if same user is trying to update the video or not
    if (video.author.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not the owner of this video");
    }

    //check which fields are being updated
    const updatedFields = {};
    if (req.body.title) {
        updatedFields.title = req.body.title;
    }
    if (req.body.description) {
        updatedFields.description = req.body.description;
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId, { $set: updatedFields }, { new: true });

    return res
        .status(200)
        .json(new ApiResponse(200, "Video updated successfully", updatedVideo))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    if (video.author.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not the owner of this video");
    }
    await Video.findByIdAndDelete(videoId);
    return res
        .status(200)
        .json(new ApiResponse(200, "Video deleted successfully", null))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle publish status
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    if (video.author.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not the owner of this video");
    }

    video.isPublished = !video.isPublished;
    await video.save();

    return res
        .status(200)
        .json(new ApiResponse(200, "Publish status toggled successfully", video))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}