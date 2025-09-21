import express from 'express';
import {
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  removeConnection,
  getUserConnections,
  checkConnectionStatus
} from '../controllers/connectionController.js';

const router = express.Router();

// Send a connection request
router.post('/request', sendConnectionRequest);

// Accept a connection request
router.post('/:requestId/accept', acceptConnectionRequest);

// Reject a connection request
router.post('/:requestId/reject', rejectConnectionRequest);

// Remove a connection
router.delete('/:targetUserId', removeConnection);

// Get user's connections
router.get('/', getUserConnections);

// Check connection status between two users
router.get('/status/:targetUserId', checkConnectionStatus);

export default router;
