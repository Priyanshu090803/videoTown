import mongoose, { Schema, Types } from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";  // for pagination, like ek bar m sari cheez nhi bhjenge


const CommentSchema = new Schema({
    content:{
        type: String,
        required:true,
        minLength:2
    },
    owner:{
         type: Schema.Types.ObjectId,
         ref:"User"
    },
    tweet:{
        type: Schema.Types.ObjectId,
        ref:"Tweet"
    },
    video:{
        type: Schema.Types.ObjectId,
        ref: "Video"
    }
    
    
},{
    timestamps:true
})
CommentSchema.plugin(mongooseAggregatePaginate)
// this help that kha se kha tk video ya comments kuch bhi dena ho
export const Comment = mongoose.model("Comment",CommentSchema)