import { sql } from "../config/db.js";

// Send a connection request
export const sendConnectionRequest = async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    const { targetUserId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: "Target user ID is required"
      });
    }

    if (userId === targetUserId) {
      return res.status(400).json({
        success: false,
        message: "Cannot connect with yourself"
      });
    }

    // Check if target user exists
    const targetUser = await sql`
      SELECT id FROM users WHERE id = ${targetUserId}
    `;

    if (targetUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Target user not found"
      });
    }

    // Check if connection request already exists
    const existingRequest = await sql`
      SELECT id FROM connection_requests 
      WHERE (requester_id = ${userId} AND target_id = ${targetUserId})
         OR (requester_id = ${targetUserId} AND target_id = ${userId})
    `;

    if (existingRequest.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Connection request already exists"
      });
    }

    // Check if users are already connected
    const currentUser = await sql`
      SELECT connections FROM users WHERE id = ${userId}
    `;

    const currentConnections = currentUser[0]?.connections || [];

    if (currentConnections.includes(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "Users are already connected"
      });
    }

    // Create connection request
    await sql`
      INSERT INTO connection_requests (requester_id, target_id, status, created_at)
      VALUES (${userId}, ${targetUserId}, 'pending', NOW())
    `;

    res.status(201).json({
      success: true,
      message: "Connection request sent successfully"
    });

  } catch (error) {
    console.error("Send connection request error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Accept a connection request
export const acceptConnectionRequest = async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    const { requestId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }

    // Check if connection request exists and user is the target
    const request = await sql`
      SELECT id, requester_id, target_id FROM connection_requests 
      WHERE id = ${requestId} AND target_id = ${userId} AND status = 'pending'
    `;

    if (request.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Connection request not found or already processed"
      });
    }

    const requesterId = request[0].requester_id;

    // Update connection request status
    await sql`
      UPDATE connection_requests 
      SET status = 'accepted', updated_at = NOW()
      WHERE id = ${requestId}
    `;

    // Add connection to both users
    await sql`
      UPDATE users 
      SET connections = array_append(connections, ${requesterId}),
          updated_at = NOW()
      WHERE id = ${userId}
    `;

    await sql`
      UPDATE users 
      SET connections = array_append(connections, ${userId}),
          updated_at = NOW()
      WHERE id = ${requesterId}
    `;

    res.status(200).json({
      success: true,
      message: "Connection request accepted"
    });

  } catch (error) {
    console.error("Accept connection request error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Reject a connection request
export const rejectConnectionRequest = async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    const { requestId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }

    // Check if connection request exists and user is the target
    const request = await sql`
      SELECT id FROM connection_requests 
      WHERE id = ${requestId} AND target_id = ${userId} AND status = 'pending'
    `;

    if (request.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Connection request not found or already processed"
      });
    }

    // Update connection request status
    await sql`
      UPDATE connection_requests 
      SET status = 'rejected', updated_at = NOW()
      WHERE id = ${requestId}
    `;

    res.status(200).json({
      success: true,
      message: "Connection request rejected"
    });

  } catch (error) {
    console.error("Reject connection request error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Remove a connection
export const removeConnection = async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    const { targetUserId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: "Target user ID is required"
      });
    }

    // Remove connection from both users
    await sql`
      UPDATE users 
      SET connections = array_remove(connections, ${targetUserId}),
          updated_at = NOW()
      WHERE id = ${userId}
    `;

    await sql`
      UPDATE users 
      SET connections = array_remove(connections, ${userId}),
          updated_at = NOW()
      WHERE id = ${targetUserId}
    `;

    res.status(200).json({
      success: true,
      message: "Connection removed successfully"
    });

  } catch (error) {
    console.error("Remove connection error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get user's connections
export const getUserConnections = async (req, res) => {
  try {
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }

    // Get user's connections
    const user = await sql`
      SELECT connections FROM users WHERE id = ${userId}
    `;

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const connectionIds = user[0].connections || [];

    if (connectionIds.length === 0) {
      return res.status(200).json({
        success: true,
        connections: []
      });
    }

    // Get connected users' details
    const connections = await sql`
      SELECT 
        id,
        username,
        first_name,
        last_name,
        country,
        university,
        created_at
      FROM users 
      WHERE id = ANY(${connectionIds})
      ORDER BY first_name, last_name
    `;

    res.status(200).json({
      success: true,
      connections: connections
    });

  } catch (error) {
    console.error("Get user connections error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Check connection status between two users
export const checkConnectionStatus = async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    const { targetUserId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: "Target user ID is required"
      });
    }

    // Check if users are connected
    const user = await sql`
      SELECT connections FROM users WHERE id = ${userId}
    `;

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const connections = user[0].connections || [];
    const connected = connections.includes(targetUserId);

    // Check if there's a pending request
    const pendingRequest = await sql`
      SELECT id, status FROM connection_requests 
      WHERE (requester_id = ${userId} AND target_id = ${targetUserId})
         OR (requester_id = ${targetUserId} AND target_id = ${userId})
    `;

    let pending = false;
    if (pendingRequest.length > 0) {
      const request = pendingRequest[0];
      if (request.status === 'pending') {
        // Check if current user is the requester or target
        const isRequester = await sql`
          SELECT id FROM connection_requests 
          WHERE id = ${request.id} AND requester_id = ${userId}
        `;
        pending = isRequester.length > 0; // Only pending if current user sent the request
      }
    }

    res.status(200).json({
      success: true,
      connected: connected,
      pending: pending
    });

  } catch (error) {
    console.error("Check connection status error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
