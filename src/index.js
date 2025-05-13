import dotenv from "dotenv"
import connectDB from "./db/index.db.js"
import { app } from "./app.js"


dotenv.config({
    path:"./.env"
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 3000, ()=>{
        console.log(`App is listening to port:${process.env.PORT}`)
    })
}
)
.catch((err)=>{
    console.log("MongoDb connection failed!",err)
})
