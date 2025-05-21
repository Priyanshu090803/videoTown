import {asyncHandler} from "../utils/asyncHandler.utils.js"
import {ApiError} from "../utils/apiError.js"
import { User } from "../model/user.model.js";  // this user is directly talk to mongoose , about the user
import {uploadOnCloudinary} from "../utils/cloudinary.service.js"
import {ApiResponse} from "../utils/apiResponse.js"
import jwt from 'jsonwebtoken'
import { use } from "react";
import mongoose, { Mongoose } from "mongoose";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const generateAcessTokenAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken= await user.generateAcessToken();
        const refreshToken= await user.generateRefreshToken();
        user.refreshToken= refreshToken;
        await user.save({validateBeforeSave:false});
        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating AcessToken or Refresh token!")
    }
}
const registerUser = asyncHandler( async(req,res)=>{
  

    const {email,fullName,username,password} = req.body        // yha pe file wala kam express ni kr pata that's why file wala ni likha h
    
    if(
        [email,fullName,username,password].some((field)=>        // some method array m lgta hai check krta h and true and false return krta h
        field?.trim()==="")
    ){
        throw new ApiError(400,"All fields are required")  //it takes 2 or more things , new as a instance k usse use kiya
    }
    if(
        !emailRegex.test(email)           // regex se test krenge
    ){
        throw new ApiError(400,"Email is not valid")
    }

    const existedUser = await User.findOne({
        $or:[{email},{fullName}]      // jitni bhi values check krni h yha hogi ki h ya ni          $ sign use krke bhot sare operators milte h
    })
    if(existedUser){
        throw new ApiError(409, "User already exist")
    }                    
    
   
    const  avatarLocalPath= req.files?.avatar[0]?.path;                    // multer middleware req k andr or fields dalta h
    // To multer gives us files ka acess for multiple acess 
    // to ye name(avatar here) k pas bhot sare options hote h file,png ,jpg
    // but we need 1st prop, bcz it has object called path of multer jha usne upload kiya h : public/temp
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
         coverImageLocalPath = req.files?.coverImage[0]?.path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   
    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    // created user and entry kr di
    const user= await User.create({                                // user backend se bat kr skta hai and yha pe user create kiya h
        fullName,
        email,
        username:username.toLowerCase(),             // lowercase m lenge
        password,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",       // if user not send url the take empty , bcz it is not required true
    }) 

    const createdUser= await User.findById(user._id).select(// if user created then mongodb will add id to it and we can find here 
            "-password -refreshToken"                        // here User have one property called select , agr select  kiya to wo add nahi hongi bcz hmne - krke lgaya h                           
    ) 

    if(!createdUser){    // agr ab user nhi bna tb throw error
        throw new ApiError(500,"Somehting went wrong while creating user")
    }
    return res.status(201).json(
       new ApiResponse(200,createdUser,"User registered sucessfully!")
    )
    }) 

    // USER LOGIN
    // req.body => data
    // username / email field not exist?    
    // check user exist by email or username?
    // if user not exist => error
    // if user exist => check for password
    // if password correct send tokens
    // send cookies
   
     const loginUser = asyncHandler(async(req,res)=>{
        const{email,username,password}=req.body;
        if(!(email || username)){
            throw new ApiError(400,"Email or password required")
        }
        const user= await User.findOne({
            $or:[{email},{username}]
        })
        if(!user){
            throw new ApiError(404, "User not exist!")
        }
        const isCorrectPassword= await user.isPasswordCorrect(password)
        if(!isCorrectPassword){
            throw new ApiError(404,"Invalid credentials!")
        }
        const {accessToken,refreshToken}= await generateAcessTokenAndRefreshToken(user._id);
        const loggedInUser= await User.findById(user._id).select(" -password -refreshToken")
        const options = {
            httpOnly:true,
            secure:true
        }
        return res
        .status(200)                             // response mai cookie bhjenge user ko
        .cookie("accessToken",accessToken,options)   // cookies mai 3 cheeze bhjte h , name , value and options of cookie
        .cookie("refreshToken",refreshToken,options)
        .json(
            new ApiResponse(
                200,              // ApiResponse takes 3 values
                {
                user:loggedInUser,refreshToken,accessToken
                },
                "User logged in Sucessfully!"
            )
        )
    })
    const logoutUser = asyncHandler(async(req,res)=>{
        User.findByIdAndUpdate(
            req.user._id,
            {
                $set:{
                    refreshToken:undefined
                }
            },{
                new:true
            }
        )
         const options = {
            httpOnly:true,
            secure:true
        }
        res.status(200)
        .clearCookie("accessToken",options)
        .clearCookie("refreshToken",options)
        .json(new ApiResponse(200,{},"User logout!"))
    })
    const refreshAccessToken= asyncHandler(async(req,res)=>{
        const incomingRefreshToken= req.cookies.refreshToken || req.body.refreshToken;
        if(!incomingRefreshToken){
            throw new ApiError(401,"Unauthorized request!")
        }
        try {
            const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
            const user = await User.findById(decodedToken._id)
            if(!user){
                throw new ApiError(401,"Invalid refresh token")
            }
            if(incomingRefreshToken !== user.refreshToken){
                throw new ApiError(401,"Refresh token expired")
            }
            const options={
                httpOnly:true,
                secure:true
            }
            const{accessToken,newRefreshToken}= await generateAcessTokenAndRefreshToken(user._id)
            res.status(200)
            .cookie("accessToken",accessToken)
            .cookie("refreshToken",newRefreshToken)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,refreshToken:newRefreshToken
                    },
                    "Access token refreshed"
                )
            )
        } catch (error) {
            throw new ApiError(404,error.message||"Refresh access token not autnorized")
        }
    })
    const changePassword = asyncHandler(async(req,res)=>{
        const user = await User.findById(req.user._id)
        const {oldPassword,newPassword,confirmPassword}= user;
        const isCorrectPassword= await user.isPasswordCorrect(oldPassword)
        if(!isCorrectPassword){
            throw new ApiError(404,"Invalid old password")
        }
        if(newPassword !== confirmPassword){
            throw new ApiError(404,"Password is not matched")
        }
        user.password = newPassword
        await user.save({validateBeforeSave:false})
        return res.status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password changed sucessfully"
            )
        )
    })
    const currentUser = asyncHandler (async(req,res)=>{
        res.status(200).
        json(
            new ApiResponse(200,req.user,"Current user fetched sucessfully")
        )
    })
    const updateAccountDetails = asyncHandler(async(req,res)=>{
        const {username,email} = req.body;
        if(!(username|| email)){
            throw new ApiError(404,"Change username and password")
        }
        const user = await User.findByIdAndUpdate(req.user?._id,
            {
                $set:{
                    username,
                    email:email
                }
            },
            {new:true}  // this will return the updated value
        ).select("-password")
        return res.status(200)
        .json(
            ApiResponse(200,user,"Account details updated sucessfully")
        )
    })
    const updateUserAvatarImage = asyncHandler(async(req,res)=>{
        try {
            const avatarLocalPath= req.file?.path
            if(!avatarLocalPath){
                throw new ApiError(404,"Can't find Avatar local path")
            }
            const avatar = await uploadOnCloudinary(avatarLocalPath)
            if(!avatar.url){
                throw new ApiError(404,"Error while uploading on avatar")
            }
            const user = User.findByIdAndUpdate(req.user._id,         // no need to save bcz this method findoneandupdate do save also
                {
                    $set:{
                        avatar:avatar.url
                    }
                },
                {new:true}
            ).select("-password")
            res.status(200)
            .json(
                new ApiResponse(200,user,"Avatar image saved sucessfully")
            )
        } catch (error) {
            throw new ApiError(404,error.message || "Avatar not updated!")
        }
    })
    const updateUserCoverImage = asyncHandler(async(req,res)=>{
       try {
        const localFilePath = req.file.path;
        if(!localFilePath){
            throw new ApiError(404,"Can't find local path")
        }
        const coverImage= await uploadOnCloudinary(localFilePath);
        if(!coverImage.url){
            throw new ApiError(404, "Error while uploading cover image")
        }
        const user = User.findByIdAndUpdate(req.user._id,
            {
                $set:{
                    coverImage:coverImage.url
                }
            },
            {new:true}
        ).select("-password")
        res.status(200).
        json(
            new ApiResponse(200,user,"Cover Image uploaded sucessfully")
        )
        } 
        catch (error) {
             throw new ApiError(404,error.message|| "Can't update Cover image!")    
        }
    })
    const getUserChannelProfile= asyncHandler(async(req,res)=>{
        const {username}=req.params;
        if(!username?.trim()){
            throw new ApiError(404,"Username not found!")
        }
        const channel= await User.aggregate([
            {
                $match:{
                    username:username?.toLowerCase()
                } // is pipeline se user mil gya hoga jise hm params se dudh rhe h
            },{
                $lookup:{
                    from:"subscriptions",   // backend mai subscription lowercase mai hoke plural ho jaega
                    localField:"_id",        // hamari localfield wli id forenfield mai match hoti h
                    foreignField:"channel",   // sare channel mai dudhenge sub ko
                    as:"subscribers"       // ye return documents krenge named subscriber Or woi document honge jnki id channel k andr wali id se match hogi
                }
            },{
                $lookup:{
                    from:"subscriptions",
                    localField:"_id",     // jitne bhi subscriber wali m localfield wali id dikegi to use lao bolra h
                    foreignField:"subscriber",   // yaha subscriber document mai localfield wali id match kraenge
                    as: "subcribedTo"
                }
            },
            // ye do field alg alg hai and ab hme inko add bhi krna h
            {
                $addFields:{       // jitni values h unko rakhega hi , but additional values add krega
                    subscriberCount:{
                        $size: "$subscribers"     // for counting {$ size} is used
                    },
                    channelSubscribedToCount:{
                        $size: "$subcribedTo"   // $subcribedTo is written bcz it is now a field
                    },
                    isSubscribed:{
                        $cond:{      //condition check hogi yha ki channel subscriber hai ya nhi 
                            if:{$in:[req.user?._id, "$subscribers.subscriber"]}, // condition mai if k andr logic check hota h, 
                            // if req.user.id subscribers.subscriber k andr hai ya nhi   or in array or obj m dekh leta h
                            then:true,
                            else:false
                        }
                    }
                }
            },
            {
                $project:{   // project is used for , ki mai ky dera hu user ko , ye selected value hi dega bas
                    fullName:1,
                    username:1,
                    subscriberCount:1,
                    channelSubscribedToCount:1,
                    isSubscribed:1,
                    coverImage:1,
                    email:1,
                    avatar:1
                }
            }
        ])
        if(!channel.length){
            throw new ApiError(400,"Channel not exist!")
        }
        return res.status(200).json(
            new ApiResponse(200,channel[0],"User channel fetched sucessfully!")
        )
    })
    const watchHistory = asyncHandler(async(req,res)=>{
        const user = await User.aggregate([
            {
                $match:{
                    _id: new mongoose.Types.ObjectId(req.user._id) // aggergation pipelines ka code directly hi jata h 
                   }                                                 
            },{
                $lookup:{
                    from:"videos",       // mongodb backend m plural and lowercase m save krta h
                    localField:"watchHistory", // local user mai watchHistory h
                    foreignField:"_id",
                    as:"watchHistory",   // ab yha pe watchHistory k andr bhot sari video mili hongi
                                            // har lookup k andr ek pipeline lgaenge for finding user/creator of video
                    pipeline:[
                        {
                            $lookup:{
                                from: "users",
                                localField:"owner",
                                foreignField:"_id",
                                as:"owner",         // owner k andr bhot sari cheeze aa gyi h User ki or hme bs 3-4 cheeze deni h
                                                   // bcz watchHistory mai to bs video and thoda sa jisne bnaaya h wo chahiye 
                                pipeline:[        // that's why we use pipeline here
                                    {
                                        $project:{
                                            username:1,
                                            fullName:1,
                                            avatar:1,
                                        }
                                    }
                                ]
                            }
                        },
                        {     // yha tk data nikal gya owner ka and next pipeline for sending neat data to frontend
                            $addFields:{       // addfield add extra value to that pipeline array
                                owner:{
                                    $fist: "$owner" // now it will send 1st data(object)

                                }
                            }
                        }
                    ]
                }
            }
        ])
        return res.status(200).
        json(
            new ApiResponse(
                200,
                user[0].watchHistory,
                "Watch history fetched sucessfully"
            )
        )
    })
export {registerUser,loginUser,logoutUser,refreshAccessToken,changePassword,currentUser,updateAccountDetails,updateUserAvatarImage ,updateUserCoverImage,getUserChannelProfile,watchHistory}