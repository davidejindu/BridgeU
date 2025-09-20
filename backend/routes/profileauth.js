import express from "express";
import { getProfile, updateProfile } from "../controllers/profileController.js";

const router = express.Router();

// GET /api/profileauth/profile - Get current user's profile
router.get("/profile", getProfile);

// PUT /api/profileauth/profile - Update user profile
router.put("/profile", updateProfile);

export default router;
