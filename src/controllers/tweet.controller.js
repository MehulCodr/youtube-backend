import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body;
    if (!content?.trim()) {
        throw new ApiError(400, "Content is required");
    }

    const tweet = await Tweet.create({
        content: content,
        author: req.user._id//comes from auth middleware
    })

    return res
        .status(201)
        .json(new ApiResponse(201, "Tweet created successfully", tweet))

})

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) { //comes from mongoose
        throw new ApiError(400, "Invalid user id");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    const tweets = await Tweet.find({ author: userId }).populate("author", "username fullname").sort({ createdAt: -1 });//-1 because we want the latest tweets first
    //why aggregate not used here? because we don't have any complex operations to perform on the data, we just need to filter tweets by author and sort them by createdAt. Aggregate is more useful when we need to perform complex operations like grouping, joining, etc. which is not the case here.

    //if aggregate is used it will look like this:
    // const tweets = await Tweet.aggregate([
    //     {$match : {author : new mongoose.Types.ObjectId(userId)}},
    //     {$sort : {createdAt : -1}}
    // ])

    return res
        .status(200)
        .json(new ApiResponse(200, "User tweets fetched successfully", tweets))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params;
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet id");
    }

    // // alternate way to check if the id is valid or not
    // if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    //     throw new ApiError(400, "Invalid tweet id");
    // }

    const { content } = req.body;
    if (!content) {
        throw new ApiError(400, "Content is required");
    }
    //check if same user is trying to update the tweet or not
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet.author.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not the owner of this tweet");
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        { content: content },
        { new: true }
    );

    if (!updatedTweet) {
        throw new ApiError(404, "Tweet not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Tweet updated successfully", updatedTweet))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params;
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id");
    }

    //check if same user is trying to delete the tweet or not
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet.author.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not the owner of this tweet");
    }

    await Tweet.findByIdAndDelete(tweetId);
    return res
        .status(200)
        .json(new ApiResponse(200, "Tweet deleted successfully", {}))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}