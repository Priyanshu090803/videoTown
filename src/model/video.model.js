import mongoose ,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";  // for pagination, like ek bar m sari cheez nhi bhjenge

const videoSchema =  new Schema({
    videoFile:{
        type:String, // cdn se ayega ... btw we can store it to db but it not good practise it make load heavy of db
        required:true
    },
    thumbnail: {
        type:String,
        required:true
        
    },
    owner: {
        type: Schema.Types.ObjectId,           // user se object id lo  
        ref: "User"
    },
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
    },
    duration:{
        type:Number  ,      // duration bhi cdn se milega . it will tell everything like url and duration
        required:true
    },
    views:{
        type:Number,
        default:0
    },
    isPublished:{
        type:Boolean,      // video public k liye available h ya nahi
        default:true
    }
},{
    timestamps:true
})

videoSchema.plugin(mongooseAggregatePaginate)  // AGGREGATION QUERIES M KAM ATI H 

export const Video = mongoose.model("Video",videoSchema)         // Video > refrecnce jaega 