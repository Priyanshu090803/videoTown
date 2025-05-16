import {asyncHandler} from "../utils/asyncHandler.utils.js"
import {ApiError} from "../utils/apiError.js"
import { User } from "../model/user.model.js";  // this user is directly talk to mongoose , about the user
import {uploadOnCloudinary} from "../utils/cloudinary.service.js"
import {ApiResponse} from "../utils/apiResponse.js"
import jwt from 'jsonwebtoken'

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
export {registerUser,loginUser,logoutUser,refreshAccessToken}