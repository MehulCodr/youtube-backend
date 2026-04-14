import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id");
    }

    const like = await Like.findOne({
        user: req.user._id,
        video: videoId
    });
    if (like) {
        await like.remove();
        return res
            .status(200)
            .json(new ApiResponse(200, "Video unliked successfully", null))
    }
    // If no like found, create a new one
    const newLike = await Like.create({
        user: req.user._id,
        video: videoId
    });
    return res
        .status(200)
        .json(new ApiResponse(200, "Video liked successfully", newLike))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment id");
    }
    const like = await Like.findOne({
        user: req.user._id,
        comment: commentId
    });
    if (like) {
        await like.remove();
        return res
            .status(200)
            .json(new ApiResponse(200, "Comment unliked successfully", null))
    }
    // If no like found, create a new one
    const newLike = await Like.create({
        user: req.user._id,
        comment: commentId
    });
    return res
        .status(200)
        .json(new ApiResponse(200, "Comment liked successfully", newLike))
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet id");
    }
    const like = await Like.findOne({
        user: req.user._id,
        tweet: tweetId
    });
    if (like) {
        await like.remove();
        return res
            .status(200)
            .json(new ApiResponse(200, "Tweet unliked successfully", null))
    }
    // If no like found, create a new one
    const newLike = await Like.create({
        user: req.user._id,
        tweet: tweetId
    });
    return res
        .status(200)
        .json(new ApiResponse(200, "Tweet liked successfully", newLike))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likedVideos = await Like.find({ user: req.user._id, video: { $ne: null } }).populate("video");
    return res
        .status(200)
        .json(new ApiResponse(200, "Liked videos fetched successfully", likedVideos))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}