import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import verifyJWT from '../middlewares/user.middleware.js'

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
export default router
