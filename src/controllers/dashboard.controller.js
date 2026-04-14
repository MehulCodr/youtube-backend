import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const channelId = req.params.channelId
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel id");
    }
    const totalVideos = await Video.countDocuments({ uploader: channelId });
    const totalSubscribers = await Subscription.countDocuments({ channel: channelId });
    const totalLikes = await Like.countDocuments({ video: { $in: await Video.find({ uploader: channelId }).select("_id") } });
    const totalViews = await Video.aggregate([
        { $match: { uploader: new mongoose.Types.ObjectId(channelId) } },
        { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ]);
    return res
        .status(200)
        .json(new ApiResponse(200, "Channel stats fetched successfully", { totalVideos, totalSubscribers, totalLikes, totalViews }))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const channelId = req.params.channelId
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel id");
    }
    const videos = await Video.find({ uploader: channelId }).populate("uploader", "username avatar").sort({ createdAt: -1 });
    return res
        .status(200)
        .json(new ApiResponse(200, "Channel videos fetched successfully", videos))
})

export {
    getChannelStats, 
    getChannelVideos
    }