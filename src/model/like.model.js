import mongoose, { Schema } from "mongoose"

const LikeSchema = new Schema({
    likedBy:{
        type:Schema.Types.ObjectId,
        required:true,
        ref:"User"
    },
    video:{
        type: Schema.Types.ObjectId,
        ref:"Video"
    },
    comment:{
        type: Schema.Types.ObjectId,
        ref: "Comment"
    },
    tweet:{
        type:Schema.Types.ObjectId,
        ref:"Tweet"
    }
    
},{
    timestamps:true
})

export const Like = mongoose.model("Like",LikeSchema)