import express from "express";
import { createConversation, searchUsers, getConversations, getMessages, sendMessage, getRecentMessages, updateConversationName, addMessageNotification, deleteMessageNotificationsByConversation, getMessageNotifications, getMessageDetails, getConversationIds } from "../controllers/messagingController.js";

const router = express.Router();

// Debug endpoint to check session
router.get("/debug-session", (req, res) => {
  console.log('Debug session - Full session:', req.session);
  console.log('Debug session - User ID:', req.session?.user?.id);
  console.log('Debug session - Headers:', req.headers);
  res.json({
    session: req.session,
    userId: req.session?.user?.id,
    authenticated: !!req.session?.user?.id
  });
});

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
router.post("/conversations", getConversationIds);

export default router;
