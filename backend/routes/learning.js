// backend/routes/learning.js
import express from "express";
import {
  getLearningContent,
  generateQuiz,
  submitQuiz,
  getUserProgress,
  getRecentActivity,
  validateLearningRequest,
  validateQuizRequest
} from "../controllers/learningController.js";

const router = express.Router();

// Get learning content for a subcategory
router.post("/content", validateLearningRequest, getLearningContent);

// Generate quiz questions for a subcategory
router.post("/quiz/generate", validateLearningRequest, generateQuiz);

// Submit quiz answers
router.post("/quiz/submit", validateQuizRequest, submitQuiz);

// Get user's learning progress
router.get("/progress/:userId", getUserProgress);

// Get recent activity for dashboard
router.get("/recent-activity/:userId", getRecentActivity);

export default router;
