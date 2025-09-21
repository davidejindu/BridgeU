import { Server } from 'socket.io';

export const initializeSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:5175"],
      credentials: true,
      methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling']
  });

  // Store user sessions
  const userSockets = new Map(); // userId -> socketId
  const socketUsers = new Map(); // socketId -> userId

  io.on('connection', (socket) => {
    console.log('New Socket.IO connection:', socket.id);

    // Handle user authentication/joining
    socket.on('join', (userId) => {
      console.log(`User ${userId} joined with socket ${socket.id}`);
      
      // Store the mapping
      userSockets.set(userId, socket.id);
      socketUsers.set(socket.id, userId);
      
      // Join user to their personal room
      socket.join(`user_${userId}`);
      
      socket.emit('connected', { message: 'Successfully connected' });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Socket.IO connection closed:', socket.id);
      
      const userId = socketUsers.get(socket.id);
      if (userId) {
        userSockets.delete(userId);
        socketUsers.delete(socket.id);
        console.log(`User ${userId} disconnected`);
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket.IO error:', error);
    });
  });

  console.log('Socket.IO server initialized');

  return {
    io,
    userSockets,
    socketUsers
  };
};
