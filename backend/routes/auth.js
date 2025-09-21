import express from "express";
import {
    registerUser,
    loginUser,
    getUserProfile,
    validateRegistration,
    validateLogin,
    me,
    logoutUser,
    getAllUsers,
    debugUserIds
} from "../controllers/userController.js";

const router = express.Router();

// PUT SPECIFIC ROUTES FIRST, PARAMETERIZED ROUTES LAST
router.post("/register", validateRegistration, registerUser);
router.post("/login", validateLogin, loginUser);
router.get("/me", me);
router.post("/logout", logoutUser);
router.get('/users', getAllUsers);  // Specific route

// PUT PARAMETERIZED ROUTES LAST
router.get("/profile/:userId", getUserProfile);  // Parameterized route
router.get("/users/:userId", getUserProfile);  // Also support /users/:userId for frontend compatibility
router.get("/debug/users", debugUserIds);  // Debug endpoint

export default router;