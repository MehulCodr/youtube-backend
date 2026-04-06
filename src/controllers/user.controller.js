import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js"
import { uploadToCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    }
    catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    //steps
    // 1- validate the request body
    // 2- check if user with the same email or username already exists
    // 3- upload avatar and cover image to cloudinary
    // 4- create the user in the database
    // 5- return the created user to the client
    const { fullname, email, username, password } = req.body;
    console.log("Request body: ", req.body);
    if ([fullname, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existedUser) {
        throw new ApiError(409, "User with username of email already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadToCloudinary(avatarLocalPath);
    const coverImage = await uploadToCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(500, "Failed to create user");
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User created successfully")
    );

})

const loginUser = asyncHandler(async (req, res) => {
    // steps
    // 1- validate the request body
    // 2- find the user by email or username
    // 3- if user not found throw error
    // 4- compare the password with the hashed password in the database
    // 5- if password is incorrect throw error
    // 6- generate access token and refresh token
    // 7- save the refresh token in the database
    // 8- return the access token and refresh token to the client

    const { email, username, password } = req.body;

    if ((!email || !username) && !password) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
                "User logged in successfully")
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .clearCookie("accessToken")
        .clearCookie("refreshToken")
        .json(
            new ApiResponse(200,
                {},
                "User logged out"
            )
        )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies?.refreshToken || req.header("Authorization")?.replace("Bearer ", "") || req.body.refreshToken;
        if (!incomingRefreshToken) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id);
        if (!user) {
            return new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            return new ApiError(401, "Refresh token is expired or used");
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id);
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed Successfully"
                )
            )
    } catch (error) {
        return new ApiError(401, error?.message || "Invalid Refresh TOken");
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if ([currentPassword, newPassword].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findById(req.user._id);
    const isCurrentPasswordValid = await user.isPasswordCorrect(currentPassword);

    if (!isCurrentPasswordValid) {
        throw new ApiError(401, "Current password is incorrect");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false }); //why validateBeforeSave?You use validateBeforeSave: false when you're doing a partial update that doesn't involve the fields being validated, to avoid unnecessary validation overhead.

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Password changed successfully")
        )
})

const getCurrentUserProfile = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(200, { user: req.user }, "Current user profile fetched successfully")
        )
    })
    
    const updateUserProfile = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body;
    
    if (!fullname && !email) {
        throw new ApiError(400, "At least one field is required");
    }
    
    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            fullname: fullname || req.user.fullname,
            email: email || req.user.email
        }
    },
    { new: true }
).select("-password -refreshToken");

return res
.status(200)
.json(
    new ApiResponse(200, { user }, "User profile updated successfully")
)
})


const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    const avatar = await uploadToCloudinary(avatarLocalPath);
    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading avatar to cloudinary");
    }

    const user = await User.findByIdAndUpdate(req.user._id, {
        $set: {
            avatar : avatar.url
        }
    }, { new: true }).select("-password -refreshToken");

    return res
    .status()
    .json(
        new ApiResponse(200, {user},"avatar updated successfully")
    )
    
    
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
        throw new ApiError(400, "cover image file is missing");
    }
    
    const coverImage = await uploadToCloudinary(coverImageLocalPath);
    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading coverImage to cloudinary");
    }
    
    const user = await User.findByIdAndUpdate(req.user._id, {
        $set: {
            coverImage : coverImage.url
        }
    }, { new: true }).select("-password -refreshToken");
    return res
    .status()
    .json(
        new ApiResponse(200, {user},"coverImage updated successfully")
    )
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUserProfile,
    updateUserProfile,
    updateUserAvatar,
    updateUserCoverImage
};