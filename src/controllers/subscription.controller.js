import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id");
    }
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    const subscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    });
    if (subscription) {
        await subscription.remove();
        return res
            .status(200)
            .json(new ApiResponse(200, "Unsubscribed successfully", null))
    }
    // If no subscription found, create a new one
    const newSubscription = await Subscription.create({
        subscriber: req.user._id,
        channel: channelId
    });
    return res
        .status(200)
        .json(new ApiResponse(200, "Subscribed successfully", newSubscription))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id");
    }
    const subscribers = await Subscription.find({ channel: channelId }).populate("subscriber", "username avatar");
    return res
        .status(200)
        .json(new ApiResponse(200, "Subscribers fetched successfully", subscribers))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber id");
    }
    const channels = await Subscription.find({ subscriber: subscriberId }).populate("channel", "username avatar");
    return res
        .status(200)
        .json(new ApiResponse(200, "Subscribed channels fetched successfully", channels))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}