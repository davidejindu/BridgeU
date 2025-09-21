import { sql } from "../config/db.js";
import bcrypt from "bcryptjs";
import { body, validationResult } from "express-validator";

export const createConversation = async (req, res) => {
    try {
        console.log('createConversation - Full session object:', JSON.stringify(req.session, null, 2));
        console.log('createConversation - Session user:', req.session?.user);
        console.log('createConversation - Headers cookie:', req.headers.cookie);
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
        console.log('createConversation - senderId from session:', senderId);
        if (!senderId) {
            console.log('createConversation - Authentication failed, no senderId in session');
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
      console.log('getConversations - Full session object:', JSON.stringify(req.session, null, 2));
      console.log('getConversations - Session user:', req.session?.user);
      console.log('getConversations - Headers cookie:', req.headers.cookie);
      const currentUserId = req.session?.user?.id;
      console.log('getConversations - Current user ID:', currentUserId);
      
      if (!currentUserId) {
        console.log('getConversations - Authentication failed, no user ID in session');
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

    // Add message to notifications for all other conversation members
    const otherMemberIds = memberIds.filter(id => id !== currentUserId);
    for (const userId of otherMemberIds) {
      try {
        // Check if user already has a notification record
        const existingRecord = await sql`
          SELECT id, message_ids FROM message_notifications 
          WHERE user_id = ${userId}
        `;

        if (existingRecord.length > 0) {
          // Update existing record by adding messageId to array
          const currentMessageIds = existingRecord[0].message_ids || [];
          const updatedMessageIds = [...currentMessageIds, newMessage.message_id];
          
          await sql`
            UPDATE message_notifications 
            SET message_ids = ${updatedMessageIds}, updated_at = NOW()
            WHERE user_id = ${userId}
          `;
        } else {
          // Create new record with messageId in array
          await sql`
            INSERT INTO message_notifications (user_id, message_ids)
            VALUES (${userId}, ${[newMessage.message_id]})
          `;
        }
      } catch (notificationError) {
        console.error('Error adding message notification:', notificationError);
        // Don't fail the entire message send if notification fails
      }
    }
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

// Add message to user's notification
export const addMessageNotification = async (req, res) => {
  try {
    const { userId, messageId } = req.body;

    if (!userId || !messageId) {
      return res.status(400).json({
        success: false,
        message: "userId and messageId are required"
      });
    }

    // Check if user already has a notification record
    const existingRecord = await sql`
      SELECT id, message_ids FROM message_notifications 
      WHERE user_id = ${userId}
    `;

    if (existingRecord.length > 0) {
      // Update existing record by adding messageId to array
      const currentMessageIds = existingRecord[0].message_ids || [];
      const updatedMessageIds = [...currentMessageIds, messageId];
      
      await sql`
        UPDATE message_notifications 
        SET message_ids = ${updatedMessageIds}, updated_at = NOW()
        WHERE user_id = ${userId}
      `;
    } else {
      // Create new record with messageId in array
      await sql`
        INSERT INTO message_notifications (user_id, message_ids)
        VALUES (${userId}, ARRAY[${messageId}])
      `;
    }

    res.json({
      success: true,
      message: "Message notification added successfully"
    });

  } catch (error) {
    console.error('Add message notification error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Delete all messages with specific conversationId for a user
export const deleteMessageNotificationsByConversation = async (req, res) => {
  try {
    const { userId, conversationId } = req.body;

    if (!userId || !conversationId) {
      return res.status(400).json({
        success: false,
        message: "userId and conversationId are required"
      });
    }

    // Get all message IDs for this conversation
    const conversationMessages = await sql`
      SELECT message_id FROM messages 
      WHERE conversation_id = ${conversationId}
    `;

    if (conversationMessages.length === 0) {
      return res.json({
        success: true,
        message: "No messages found for this conversation"
      });
    }

    const messageIdsToRemove = conversationMessages.map(msg => msg.message_id);

    // Get current notification record
    const existingRecord = await sql`
      SELECT id, message_ids FROM message_notifications 
      WHERE user_id = ${userId}
    `;

    if (existingRecord.length > 0) {
      const currentMessageIds = existingRecord[0].message_ids || [];
      // Remove message IDs that belong to this conversation
      const updatedMessageIds = currentMessageIds.filter(id => !messageIdsToRemove.includes(id));
      
      await sql`
        UPDATE message_notifications 
        SET message_ids = ${updatedMessageIds}, updated_at = NOW()
        WHERE user_id = ${userId}
      `;
    }

    res.json({
      success: true,
      message: "Message notifications deleted successfully",
      removedCount: messageIdsToRemove.length
    });

  } catch (error) {
    console.error('Delete message notifications error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get array of message IDs for a user
export const getMessageNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required"
      });
    }

    const notificationRecord = await sql`
      SELECT message_ids FROM message_notifications 
      WHERE user_id = ${userId}
    `;

    if (notificationRecord.length === 0) {
      return res.json({
        success: true,
        messageIds: []
      });
    }

    const messageIds = notificationRecord[0].message_ids || [];

    res.json({
      success: true,
      messageIds: messageIds
    });

  } catch (error) {
    console.error('Get message notifications error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get message details by message IDs
export const getMessageDetails = async (req, res) => {
  try {
    const { messageIds } = req.body;

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "messageIds array is required"
      });
    }

    const messages = await sql`
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
      WHERE m.message_id = ANY(${messageIds})
      ORDER BY m.created_at DESC
    `;

    res.json({
      success: true,
      messages: messages
    });

  } catch (error) {
    console.error('Get message details error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get conversation IDs from message IDs
export const getConversationIds = async (req, res) => {
  try {
    const { messageIds } = req.body;

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.json({
        success: true,
        conversations: []
      });
    }

    const conversations = await sql`
      SELECT DISTINCT conversation_id 
      FROM messages 
      WHERE message_id = ANY(${messageIds})
    `;

    res.json({
      success: true,
      conversations: conversations
    });

  } catch (error) {
    console.error('Get conversation IDs error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};