import express from "express";
import { createConversation, searchUsers, getConversations, getMessages, sendMessage } from "../controllers/messagingController.js";

const router = express.Router();

router.post("/", createConversation);
router.get("/", getConversations);
router.get("/search-users", searchUsers);
router.get("/:conversationId/messages", getMessages);
router.post("/send", sendMessage);

export default router;
