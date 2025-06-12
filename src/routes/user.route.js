import { Router } from "express";
import { changePassword, currentUser, getUserChannelProfile, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatarImage, updateUserCoverImage, watchHistory } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import {verifyJWT} from '../middlewares/user.middleware.js'

const router = Router();

router.route("/register").post(
    upload.fields([      // for multiple fields           // injected middleware
        {
            name: "avatar",
            maxCount:1
        },
        {
            name:"coverImage",             // ye nam postman m dalna wrna error ayega
            maxCount:1
        }
    ]
    )
    ,
    
    registerUser)
router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").patch(verifyJWT,changePassword)
router.route("/current-user").get(verifyJWT,currentUser)
router.route("/update-account").patch(verifyJWT,updateAccountDetails)
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatarImage)
router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)
router.route("/channel/:username").get(verifyJWT,getUserChannelProfile)
router.route("/history").get(verifyJWT,watchHistory)
export default router
