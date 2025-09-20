import express from "express";
import { 
    registerUser, 
    loginUser, 
    getUserProfile,
    validateRegistration,
    validateLogin,
    me,
    logoutUser
} from "../controllers/userController.js";

const router = express.Router();

// POST /api/auth/register - Register a new user
router.post("/register", validateRegistration, registerUser);

// POST /api/auth/login - Login user
router.post("/login", validateLogin, loginUser);

// GET /api/auth/profile/:userId - Get user profile (optional)
router.get("/profile/:userId", getUserProfile);

router.get("/me", me);
router.post("/logout", logoutUser);

export default router;
