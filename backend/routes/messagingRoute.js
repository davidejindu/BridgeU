import express from "express";
import { createConversation, searchUsers, getConversations, getMessages, sendMessage, getRecentMessages, updateConversationName, addMessageNotification, deleteMessageNotificationsByConversation, getMessageNotifications, getMessageDetails } from "../controllers/messagingController.js";

const router = express.Router();

router.post("/", createConversation);
router.get("/", getConversations);
router.get("/search-users", searchUsers);
router.get("/recent", getRecentMessages);
router.get("/:conversationId/messages", getMessages);
router.post("/send", sendMessage);
router.put("/:conversationId/name", updateConversationName);

// Message notification routes
router.post("/notifications/add", addMessageNotification);
router.delete("/notifications/delete", deleteMessageNotificationsByConversation);
router.get("/notifications/:userId", getMessageNotifications);
router.post("/details", getMessageDetails);

export default router;
