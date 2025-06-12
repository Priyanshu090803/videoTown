import mongoose, { Schema } from "mongoose"

const PlaylistSchema = new Schema({
    name:{
        type:String,
    },
    description:{
        type:String
    },
    createdBy:{
        type: Schema.Types.ObjectId,
        ref:"User"
    },
    videos:[{
        type:Schema.Types.ObjectId,
        ref:"Video"
    }],

},{
    timestamps:true
})

export const Playlist = mongoose.model("Playlist",PlaylistSchema)

