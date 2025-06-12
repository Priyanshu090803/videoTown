import mongoose, { Schema } from "mongoose"

const TweetSchema = new Schema({
    content:{
        type:String,
        minLength:2
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref:"User"
    }
},{
    timestamps:true
})

export const Tweet = mongoose.model("Tweet",TweetSchema)