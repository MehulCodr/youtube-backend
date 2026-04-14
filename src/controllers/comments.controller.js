import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }
    const comments = await Comment.find({ video: videoId })
        .populate("user", "username avatar")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
    const totalComments = await Comment.countDocuments({ video: videoId });
    return res
        .status(200)
        .json(new ApiResponse(200, "Comments fetched successfully", { comments, totalComments }))
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const {text} = req.body 
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }
    const comment = await Comment.create({
        video: videoId,
        user: req.user._id,
        text
    });
    return res
        .status(200)
        .json(new ApiResponse(200, "Comment added successfully", comment))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const {text} = req.body
    if(!text?.trim()){
        throw new ApiError(400, "Comment text is required");
    }
    if(!mongoose.Types.ObjectId.isValid(commentId)){
        throw new ApiError(400, "Invalid comment id");
    }
    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(404, "Comment not found");
    }
    comment.text = text;
    await comment.save();
    return res
        .status(200)
        .json(new ApiResponse(200, "Comment updated successfully", comment))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params
    if(!mongoose.Types.ObjectId.isValid(commentId)){
        throw new ApiError(400, "Invalid comment id");
    }
    const comment = await Comment.findById(commentId);
    if(!comment){ 
        throw new ApiError(404, "Comment not found");
    }
    await comment.remove();
    return res
        .status(200)
        .json(new ApiResponse(200, "Comment deleted successfully", null))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }