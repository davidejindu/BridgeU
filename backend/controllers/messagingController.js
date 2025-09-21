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

        // Check if a conversation with the same members already exists
        const existingConversations = await sql`
          SELECT conversation_id, member_ids
          FROM conversations
          WHERE member_ids @> ${memberIds}
          AND array_length(member_ids, 1) = ${memberIds.length}
        `;

        if (existingConversations.length > 0) {
            console.log('Conversation already exists with these members:', existingConversations[0]);
            return res.status(409).json({ 
              error: "A conversation with these members already exists",
              existingConversationId: existingConversations[0].conversation_id
            });
        }

        // Get the sender ID from the current user session
        const senderId = req.session?.user?.id;
        if (!senderId) {
            return res.status(401).json({ error: "User not authenticated" });
        }
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

        try {
          const io = req.app.get('io');
          if (io) {
              memberIds.forEach(id => {
                  io.to(`user_${id}`).emit('new_conversation', {
                      conversationId: conversation.conversation_id,
                  });
              });
          }
        } catch (socketError) {
          console.log('Socket.IO error (non-critical):', socketError);
        }

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
          c.name,
          u.first_name,
          u.last_name,
          u.username,
          u.university
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
            name: row.name,
            totalMemberCount: row.member_ids.length,
            members: []
          });
        }
        conversationMap.get(convId).members.push({
          id: row.member_id,
          firstName: row.first_name,
          lastName: row.last_name,
          username: row.username,
          university: row.university
        });
      });

      const formattedConversations = Array.from(conversationMap.values());
      res.json(formattedConversations);
    } catch (err) {
      console.error('getConversations error:', err);
      res.status(500).json({ error: "Failed to get conversations" });
    }
  };

export const getMessages = async (req, res) => {
    try {
      const { conversationId } = req.params;
      const currentUserId = req.session?.user?.id;
      
      if (!currentUserId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Verify user is a member of this conversation
      const conversation = await sql`
        SELECT conversation_id, member_ids
        FROM conversations
        WHERE conversation_id = ${conversationId}
        AND ${currentUserId} = ANY(member_ids)
      `;

      if (conversation.length === 0) {
        return res.status(403).json({ error: "Access denied to this conversation" });
      }

      // Get messages for this conversation
      const messages = await sql`
        SELECT 
          m.message_id,
          m.message,
          m.created_at,
          m.sender_id,
          u.first_name,
          u.last_name,
          u.username
        FROM messages m
        JOIN users u ON u.id = m.sender_id
        WHERE m.conversation_id = ${conversationId}
        ORDER BY m.created_at ASC
      `;

      res.json(messages);
    } catch (err) {
      console.error('getMessages error:', err);
      res.status(500).json({ error: "Failed to get messages" });
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

export const sendMessage = async (req, res) => {
  try {
    const { conversationId, message } = req.body;
    const currentUserId = req.session?.user?.id;
    
    if (!currentUserId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    if (!conversationId || !message) {
      return res.status(400).json({ error: "conversationId and message are required" });
    }

    // Verify user is a member of this conversation
    const conversation = await sql`
      SELECT conversation_id, member_ids
      FROM conversations
      WHERE conversation_id = ${conversationId}
      AND ${currentUserId} = ANY(member_ids)
    `;

    if (conversation.length === 0) {
      return res.status(403).json({ error: "Access denied to this conversation" });
    }

    const memberIds = conversation[0].member_ids;

    // Insert the message
    const [newMessage] = await sql`
      INSERT INTO messages (conversation_id, sender_id, message, created_at)
      VALUES (${conversationId}, ${currentUserId}, ${message.trim()}, NOW())
      RETURNING *;
    `;

    // Get sender's name for the socket event
    const [senderInfo] = await sql`
      SELECT first_name, last_name, username
      FROM users
      WHERE id = ${currentUserId}
    `;

    // Update conversation's last message and timestamp
    await sql`
      UPDATE conversations 
      SET last_message = ${message.trim()}, last_message_time = NOW()
      WHERE conversation_id = ${conversationId}
    `;
    try {
      const io = req.app.get('io');
      if (io) {
          // Emit new message to all conversation members
          memberIds.forEach(id => {
              io.to(`user_${id}`).emit('new_message', {
                  conversationId: conversationId,
                  senderId: currentUserId,
                  message: message.trim(),
                  messageId: newMessage.message_id,
                  timestamp: newMessage.created_at,
                  senderName: `${senderInfo.first_name} ${senderInfo.last_name}`
              });
          });
          
          // Emit conversation update to all conversation members to refresh their conversation list
          memberIds.forEach(id => {
              io.to(`user_${id}`).emit('conversation_updated', {
                  conversationId: conversationId,
                  lastMessage: message.trim(),
                  lastMessageTime: newMessage.created_at
              });
          });
      }
    } catch (socketError) {
      console.log('Socket.IO error (non-critical):', socketError);
    }
    res.json(newMessage);
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ error: "Failed to send message" });
  }
};

// Update conversation name
export const updateConversationName = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { name } = req.body;
    const currentUserId = req.session?.user?.id;
    
    if (!currentUserId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Conversation name is required" });
    }

    // Verify user is a member of this conversation
    const conversation = await sql`
      SELECT conversation_id, member_ids
      FROM conversations
      WHERE conversation_id = ${conversationId}
      AND ${currentUserId} = ANY(member_ids)
    `;

    if (conversation.length === 0) {
      return res.status(403).json({ error: "Access denied to this conversation" });
    }

    // Check if this is a group chat (3+ members)
    if (conversation[0].member_ids.length < 3) {
      return res.status(400).json({ error: "Name changes are only allowed for group chats (3+ members)" });
    }

    // Update the conversation name
    await sql`
      UPDATE conversations 
      SET name = ${name.trim()}
      WHERE conversation_id = ${conversationId}
    `;

    // Emit conversation update to all conversation members
    try {
      const io = req.app.get('io');
      if (io) {
        const memberIds = conversation[0].member_ids;
        memberIds.forEach(id => {
          io.to(`user_${id}`).emit('conversation_name_updated', {
            conversationId: conversationId,
            name: name.trim()
          });
        });
      }
    } catch (socketError) {
      console.log('Socket.IO error (non-critical):', socketError);
    }

    res.json({ success: true, name: name.trim() });
  } catch (err) {
    console.error('updateConversationName error:', err);
    res.status(500).json({ error: "Failed to update conversation name" });
  }
};

// Get recent messages for notifications
export const getRecentMessages = async (req, res) => {
  try {
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }

    // Get conversations where user is a member
    const conversations = await sql`
      SELECT conversation_id, member_ids
      FROM conversations
      WHERE ${userId} = ANY(member_ids)
    `;

    if (conversations.length === 0) {
      return res.status(200).json({
        success: true,
        messages: []
      });
    }

    const conversationIds = conversations.map(conv => conv.conversation_id);

    // Get recent messages from the last 24 hours
    const recentMessages = await sql`
      SELECT 
        m.message_id,
        m.conversation_id,
        m.sender_id,
        m.message,
        m.created_at,
        u.first_name,
        u.last_name,
        u.username
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ANY(${conversationIds})
        AND m.sender_id != ${userId}
        AND m.created_at > NOW() - INTERVAL '24 hours'
      ORDER BY m.created_at DESC
      LIMIT 10
    `;

    res.status(200).json({
      success: true,
      messages: recentMessages
    });

  } catch (error) {
    console.error('Get recent messages error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};