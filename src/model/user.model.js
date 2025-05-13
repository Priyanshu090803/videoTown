import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from 'bcrypt'


const userSchema= new Schema(
    {
        watchHistory:{
            type: Schema.Types.ObjectId,       // ye video model KI  id hoga iska type   KYUKI USER KI WATCHHISTORY HOGI USKE ANDR VIDEO HOGI 
            ref: "Video"                            // OR ISKA REFRENCE VIDEO MODEL SE H
        },
        username:{
            required:true,
            type:String,
            minLength:2,
            maxLength:10,
            lowercase:true,
            trim:true,
            unique:true,
            index: true             // kisi bhi db mai agr search optimise krni , jaldi search krna h to us field ko true kardo
        },                          //thoda expensive pr unta ni , SABKO MT DE DENA INDEX TRUE , BAND BAJ JAEGI
   
        email:{
            required:true,
            type:String,
            minLength:2,
            lowercase:true,
            trim:true,
            unique:true
        },
        fullName:{
            required:true,
            type:String,
            minLength:2,
            maxLength:20,
            trim:true,
            index: true
        },
        avatar:{
            type:String  ,        // cloudnary url use , free hoti h cdn
            required:true,
        },
        coverImage:{
            type:String  ,        // cloudnary url use , free hoti h cdn
            
        },
        password:{
            type:String,
            required: [true, 'Password is required']       // yha pe custom message bhi dala h , true k sath
        },
        refreshToken:{
            type:String 
        },
    },{
        timestamps:true
    }
)

// NICHE KI CHEEZE INJECT KRRE HAI HAM SCHEMA K ANDR

userSchema.pre('save', async function(next){                     //user kuch save krega to usse pehle ye hook lgega
    if(!this.isModified("password")) return next();             // agr password modify nahi hua h to next kardo . JAISE USER NE PHOTO UPDATE KI
    this.password = await bcrypt.hash(this.password, 10)             // password ko hash kardo and SALTING KARDO then next call kardo  ..  AND DB WLE PASSWORD M DALDO
    next()                                                    // since, ye ek type ka middleware h to next() call hoga
})

 //    AB JO PASSWORD HASH KIYA H USKO CHECK  BHI

 userSchema.methods.isPasswordCorrect = async function(password){       // isme user ka dala hua password hoga
    return await bcrypt.compare(password,this.password)                //isme compare user k password se hashed password ko 
 }                    // (EK DATA MANGTA H ) OR (ENCRYPTED PASSWORD FOR COMPARE   . AND RETURN CALUE IN  TRUE AND FALSE)





userSchema.methods.generateAcessToken= function(){
    return jwt.sign(                              // jwt ka sign method it generates the token
        
        {                               // 1st payload            
          _id:this._id,                // ye cheeZ db mai save hai and this lgake acess krenge from mongodb
          email:this.email,
          username:this.username,       // payload ki key/name and second database se ari
          fullName:this.fullName         // payload key: from db
        },
        process.env.ACCESS_TOKEN_SECRET, // 2nd cheez ise acess token lagta hai
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY      // 3rd kab expire hoga
        }
    )                                            
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id:this._id,               // refresh token bar bar refresh hota h to isme bs id rkhenge   
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }

    )
}



export const User = mongoose.model("User",userSchema)   // mongodb mai user , users mai change hoke save hoga
// ye user db se bat krega bcz it directly made from mongoose