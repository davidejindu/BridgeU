import express from "express";
import { createConversation, searchUsers, getConversations } from "../controllers/messagingController.js";

const router = express.Router();

router.post("/", createConversation);
router.get("/", getConversations);
router.get("/search-users", searchUsers);

export default router;
