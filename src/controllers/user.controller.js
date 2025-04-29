import {asyncHandler} from "../utils/asyncHandler.utils.js"
import {ApiError} from "../utils/apiError.js"
import { User } from "../model/user.model.js";  // this user is directly talk to mongoose , about the user
import {uploadOnCloudinary} from "../utils/cloudinary.service.js"
import {ApiResponse} from "../utils/apiResponse.js"


const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const registerUser = asyncHandler( async(req,res)=>{
    try{
  

    const {email,fullName,username,password} = req.body        // yha pe file wala kam express ni kr pata that's why file wala ni likha h
    // console.log("email:",email)

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
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    const uploadAvatartoCloudinary = await uploadOnCloudinary(avatarLocalPath)
    const uploadCoverImgtoCloudinary = await uploadOnCloudinary(coverImageLocalPath)

    if(!uploadAvatartoCloudinary){
        throw new ApiError(400,"Avatar file is required")
    }

    // created user and entry kr di
    const user= await User.create({                                // user backend se bat kr skta hai and yha pe user create kiya h
        fullName,
        email,
        username:username.toLoweCase(),             // lowercase m lenge
        password,
        uploadAvatartoCloudinary:uploadAvatartoCloudinary.url,
        uploadCoverImgtoCloudinary:uploadCoverImgtoCloudinary?.url || "",       // if user not send url the take empty , bcz it is not required true
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

    }catch(err){
        throw new Error("Error:",err.message)
                  }
        })
export {registerUser}