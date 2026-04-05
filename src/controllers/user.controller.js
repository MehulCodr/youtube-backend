import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User } from "../models/user.model.js"
import {uploadToCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";


const generateAccessAndRefreshTokens = async(userId) => {
    try{
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false});

        return {accessToken , refreshToken};
    }
    catch (error){
        throw new ApiError(500,"Something went wrong while generating access and refresh token");
    }
}

const registerUser = asyncHandler(async (req , res) => {
    //steps
    // 1- validate the request body
    // 2- check if user with the same email or username already exists
    // 3- upload avatar and cover image to cloudinary
    // 4- create the user in the database
    // 5- return the created user to the client
    const {fullname, email, username, password} = req.body;
    console.log("Request body: ", req.body);
    if([fullname, email, username, password].some((field) => field?.trim() === "")) 
    {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser =  await User.findOne({
        $or: [{username} , {email}]
    });

    if(existedUser)
    {
        throw new ApiError(409, "User with username of email already exists");
    }

    const avatarLocalPath =  req.files?.avatar[0]?.path;
    const coverImageLocalPath =  req.files?.coverImage?.[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar =  await uploadToCloudinary(avatarLocalPath);
    const coverImage = await uploadToCloudinary(coverImageLocalPath);

    if(!avatar)
    {
        throw new ApiError(400, "Avatar file is required");
    }

    const user = await User.create({
        fullname,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email, 
        password,
        username : username.toLowerCase()
    });

    const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
    );

    if(!createdUser)
    {
        throw new ApiError(500, "Failed to create user");
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User created successfully")
    );

})

const loginUser = asyncHandler(async (req , res) => {
    // steps
    // 1- validate the request body
    // 2- find the user by email or username
    // 3- if user not found throw error
    // 4- compare the password with the hashed password in the database
    // 5- if password is incorrect throw error
    // 6- generate access token and refresh token
    // 7- save the refresh token in the database
    // 8- return the access token and refresh token to the client

    const {email,username, password} = req.body;

    if((!email || !username) && !password)
    {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findOne({
        $or : [{username} , {email }]
    });

    if(!user)
    {
        throw new ApiError(404, "User does not exist");
    }
    
    const isPasswordValid =  await user.isPasswordCorrect(password);
    
    if(!isPasswordValid)
    {
        throw new ApiError(401, "Invalid password");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly : true,
        secure : true
    }
    return res
    .status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, {
            user : loggedInUser,
            accessToken, 
            refreshToken
        },
        "User logged in successfully")
    )

})

const logoutUser = asyncHandler(async (req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
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

export {registerUser, loginUser, logoutUser};