import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler.utils";
import jwt from 'jsonwebtoken'
import { User } from "../model/user.model";

export const verifyJWT = asyncHandler(async(req,res, next)=>{
    try{const token = req?.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","") // yha pe header mai wrna bearer hota h and then token hota h
    if(!token){
        throw new ApiError(401,"Unauthorized request!")
    }
    const decodedToken= jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    // this will return the decoded value after verify
    const user = await User.findById(decodedToken._id).select("-password -refreshToken")
    if(!user){
        throw new ApiError(401, "Invalid acess token")
    }
    req.user = user;
    }catch(error){
    throw new ApiError(401,error?.message||"Invalid acess token")
}
})