import { sql } from "../config/db.js";
import bcrypt from "bcryptjs";
import { body, validationResult } from "express-validator";

export const createConversation = async (req, res) => {
    try {
        console.log('createConversation called with:', req.body);
        const { memberIds, firstMessage } = req.body;
        
        if (!Array.isArray(memberIds) || memberIds.length < 2) {
            console.log('Invalid memberIds:', memberIds);
            return res.status(400).json({ 
              error: "memberIds must be an array with at least 2 UUIDs" 
            });
        }
        if (!firstMessage || firstMessage.trim().length === 0) {
            console.log('Invalid firstMessage:', firstMessage);
            return res.status(400).json({ 
              error: "firstMessage is required" 
            });
        }

        // Get the sender ID (first member in the array)
        const senderId = memberIds[0];
        console.log('Creating conversation with senderId:', senderId, 'memberIds:', memberIds);

        // Create the conversation
        const [conversation] = await sql`
          INSERT INTO conversations (member_ids, last_message, last_message_time)
          VALUES (${memberIds}, ${firstMessage.trim()}, NOW())
          RETURNING *;
        `;
        console.log('Conversation created:', conversation);

        // Create the first message
        const [message] = await sql`
          INSERT INTO messages (conversation_id, sender_id, message, created_at)
          VALUES (${conversation.conversation_id}, ${senderId}, ${firstMessage.trim()}, NOW())
          RETURNING *;
        `;
        console.log('Message created:', message);

        res.status(201).json({
          conversation,
          message
        });
      } catch (error) {
        console.error('createConversation error:', error);
        res.status(500).json({ error: "Failed to create conversation" });
      }
};
export const getConversations = async (req, res) => {
    try {
      console.log('getConversations - Session:', req.session);
      const currentUserId = req.session?.user?.id;
      console.log('getConversations - Current user ID:', currentUserId);
      
      if (!currentUserId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Get conversations where current user is a member
      const conversations = await sql`
        SELECT 
          c.conversation_id,
          c.member_ids,
          c.last_message,
          c.last_message_time,
          c.created_at,
          u.first_name,
          u.last_name,
          u.username
        FROM conversations c
        CROSS JOIN LATERAL unnest(c.member_ids) AS member_id
        JOIN users u ON u.id = member_id
        WHERE ${currentUserId} = ANY(c.member_ids)
        AND u.id != ${currentUserId}
        ORDER BY c.last_message_time DESC;
      `;

      // Group conversations and format response
      const conversationMap = new Map();
      
      conversations.forEach(row => {
        const convId = row.conversation_id;
        if (!conversationMap.has(convId)) {
          conversationMap.set(convId, {
            id: convId,
            lastMessage: row.last_message,
            lastMessageTime: row.last_message_time,
            createdAt: row.created_at,
            members: []
          });
        }
        conversationMap.get(convId).members.push({
          id: row.member_id,
          firstName: row.first_name,
          lastName: row.last_name,
          username: row.username
        });
      });

      const formattedConversations = Array.from(conversationMap.values());
      res.json(formattedConversations);
    } catch (err) {
      console.error('getConversations error:', err);
      res.status(500).json({ error: "Failed to get conversations" });
    }
  };

export const searchUsers = async (req, res) => {
    try {
      const { query } = req.query;
  
      if (!query || query.trim().length === 0) {
        return res.status(400).json({ error: "Search query cannot be empty" });
      }

      // Get current user ID from session
      const currentUserId = req.session?.user?.id;
      console.log('Current user ID from session:', currentUserId);
      console.log('Session data:', req.session);
  
      // Search by username (case-insensitive, partial match) and exclude current user
      const users = await sql`
        SELECT id as user_id, username, first_name, last_name, country, university, created_at
      FROM users
      WHERE ((first_name || ' ' || last_name) ILIKE ${`%${query}%`}
      OR username ILIKE ${`%${query}%`})
      ${currentUserId ? sql`AND id != ${currentUserId}` : sql``}
      LIMIT 10;
      `;
  
      res.json(users);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to search users" });
    }
  };