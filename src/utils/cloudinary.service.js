import { v2 as cloudinary } from 'cloudinary';              // cloudinary krke use krre h hm v2
import fs from "fs"

// ye  hm isliye krre h bcz we assumed that Hmare server mai file aa chuki hai and now we have to upload to cloudinary


    // Configuration
    cloudinary.config({                        // ye configuration will give permission to upload file , wrna kse pta chlega konsa account h
        cloud_name: process.env.CLOUD_NAME, 
        api_key: process.env.API_KEY, 
        api_secret: process.env.API_SECRET // Click 'View API Keys' above to copy your API secret
    })


    // method bnaenge or us method k andr localfile ka path denge parameter m and us localfile ko upload krenge and sucessfully upload hua then file ko unlink kr denge
    const uploadOnCloudinary = async(localFilePath)=>{
        try{
            if(!localFilePath) return null;

            // NOW WE HAVE FILE TOHH AB ISE CLOUDINARY M UPLOAD KRENGE
            const response = await cloudinary.uploader.upload(     // UPLOAD M HM LOCALFILEPATH DALRE , WE CAN ALSO ADD MANY THINGS
                localFilePath,{
                    resource_type: "auto"  // YE HMARE UPLOAD OPTIONS H :> WE CHOOSE RESOURSE TYPE
                }
            )
            // file uploaded sucessfully
            console.log("File is uploaded in cloudinary",response.url)       // UPLOAD HONE K BAD KA PUBLIC URL MIL JAEGA BY RES.URL
            fs.unlinkSync(localFilePath)       // after uploading to cloudinary from local file it should be deleted from local
            return response
        }
        catch{
                                     // YHA TK AYE H THAT MEANS THAT FILE IS IN OUR SERVER
                                     // TO WO UPLOAD NHI HUA H , TOH FOR SAFE CLEANING PURPOSE WE HAVE TO REMOVE FROM SERVER
          fs.unlinkSync(localFilePath)   // remove the locally saved temporary file as the upload operation got failed  
          return null
        }
    }
    export {uploadOnCloudinary}