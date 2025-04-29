import multer from "multer";


const storage = multer.diskStorage({ 
    destination: function (req, file, cb) {
      cb(null, './public/temp')      // files ko yha rkhenge for server 
    },
    filename: function (req, file, cb) {                   // req is coming from user  // or file k andr sari files milengi
        // or req k file bhi ari h To (file) wala option diya h multer mai bcz express can't do this 
          cb(null, file.originalname)  // user ne jis name se upload ki h usi name se save krre h ham
          // this is not that good method bcz user can make 4-5 files with same name , but ye kam bhot kam time k liye hoga 
          // file hmare server k andr bhot kam time k liye rhegi
    }
  })
    
 export const upload = multer({
   storage,
    })


// multer ko middleware bnaenge bcz , multer does file uploading things from user to cloudinary.

// User => Multer => local server => Multer => Cloudinary


// Jha bhi file uploading wala stuff hoga to wha pe multer lga lenge , to upload user's file.


// For multer go to multer github