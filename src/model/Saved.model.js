import mongoose, { Schema } from "mongoose";

const SavedSchema  = new Schema({
    collection:[{
        type:Schema.Types.ObjectId,
        ref:"Video"
    }]
})

export const Saved = mongoose.model("Saved",SavedSchema)