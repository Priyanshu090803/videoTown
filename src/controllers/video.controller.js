import { asyncHandler } from "../utils/asyncHandler.utils";
import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from '../utils/apiResponse.js'

const getAllVideos = asyncHandler(async(req,res)=>{
    //TODO: get all videos based on query, sort, pagination 

    const {page=1,limit=10,query,sortBy,sortType,userId} =  req.query
    // pagination
    const pageNum = parseInt(page)
    const limitNum= parseInt(limit)
    const skip = limitNum*(pageNum-1)

    const queryfilter = {}  // query filter for vdo title, description and userid.
    if(query){    // yha pe ya title mai dudho ya description mai dudho
        queryfilter.$or=[  // The $or property only becomes meaningful when this object is passed to MongoDB
            {title:{$regex:query,$options:'i'}}, // $regex is MongoDB's regular expression operator for pattern matching(just like .includes with more power)
            {description:{$regex:query,$options:'i'}}, // 'i' means "case-insensitive"  Matches any case { title: { $regex: "JavaScript" } }// ✅ Matches: "JavaScript Tutorial"// ❌ Doesn't match: "javascript tutorial" // ❌ Doesn't match: "JAVASCRIPT basics" 
            {tags:{$regex:query,$options:'i'}}
        ]
    }
    if(userId){
        if(!isValidObjectId(userId)){  // agr valid obj id nahi h to error faiko isValidObjectId (mongodb function)
            return res.json({
                sucess:false,
                message:"Invalid user id"
            })
        }
        queryfilter.owner= new mongoose.Types.ObjectId(userId)                      // agr valid obj id hai to query mai daldo
    }
    const sortOptions={}
    const canSort = ['createdAt', 'views', 'duration', 'title']
    if(canSort.includes(sortBy)){
        sortOptions[sortBy]=sortType==='asc'?1:-1
    }else{
        sortOptions['createdAt']=-1;   // default mai descending order mai sort and created at k bais mai
    }// descending mai isiliye bcz mongoose:-1: Descending (Z→A, 100→1, newest→oldest) 1: Ascending (A→Z, 1→100, oldest→newest)
    
    // aggregation pipeline
    const videos = await Video.aggregate([
        {
            $match:{queryfilter}
        },
        {
            $lookup:{
                from:'users',
                localField:'owner',
                foreignField:'_id',
                as:'owner',
                pipeline:[
                    {
                        $project:{  // jo video nikale hai uka ye do
                            username:1, /* This ONLY affects user documents, not video fields */ 
                            avatar:1,
                            fullname:1
                        }
                    }
                ]
            }
        },
        {
        $unwind:'$owner'    
        },
        {$skip:skip},
        {$limit:limitNum},
        {$sort:sortOptions},
        {
            $project:{
                title:1,
                  description: 1,
                    thumbnail: 1,
                    videoFile: 1,
                    duration: 1,
                    views: 1,
                    createdAt: 1,
                    owner: 1,
                    tags: 1
            }
        }
    ])
    const total = await Video.countDocuments(queryfilter)  // for counting vidoes
    return res.status(200).json(
        new ApiResponse({
            status:200,
            videos,
            pagination:{
                total,
                page:pageNum,
                limit:limitNum,
                totalPages: Math.ceil(total/limitNum)
            }
        },'Video fetched sucessfully!')
    )
})

export {getAllVideos}
