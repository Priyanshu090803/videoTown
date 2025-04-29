GET user from the frontend:
Validation - KUch email ya username empty to ni bhja , email wrong to ni bhja
Check user is already exist: username , email -- uniqueness se
Check avatar image from the user  - multer upload
Store it to cloudinary, avatar  - cloudinary upload hone k bad res bhjta h jisme url hota h use bhjenge . avatar ek or bar check hoga cloudinary m save hua krke
Create a user object in db - creat entry in db

remove the refresh tokens and password  - bcz jse user create hota h wse wo response m mogodb send back  krta h user ko jisme pass and refresh token honge to unko send ni krenge   

check for creation 
send response