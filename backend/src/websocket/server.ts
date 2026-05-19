// WebSocket Server using Socket.IO
// Handles real-time bidirectional communication for notifications

import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { connectionManager } from './connectionManager.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export function initializeWebSocketServer(httpServer: HTTPServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      console.log('[WebSocket] Connection rejected: No token provided');
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id?: string; userId?: string };
      const userId = decoded.id ?? decoded.userId;
      if (!userId) {
        return next(new Error('Authentication error: Invalid token payload'));
      }
      socket.userId = userId;
      console.log(`[WebSocket] Authentication successful for user: ${userId}`);
      next();
    } catch (err) {
      console.log('[WebSocket] Connection rejected: Invalid token');
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    
    console.log(`[WebSocket] Client connected: ${socket.id} (User: ${userId})`);
    
    // Add connection to manager
    connectionManager.addConnection(userId, socket);

    // Send connection confirmation
    socket.emit('connected', {
      message: 'WebSocket connection established',
      userId,
      socketId: socket.id,
      timestamp: new Date().toISOString(),
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`[WebSocket] Client disconnected: ${socket.id} (User: ${userId}, Reason: ${reason})`);
      connectionManager.removeConnection(socket.id);
    });

    // Handle ping/pong for connection health check
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // Handle notification acknowledgment
    socket.on('notification_received', (data: { notificationId: string }) => {
      console.log(`[WebSocket] Notification ${data.notificationId} acknowledged by user ${userId}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`[WebSocket] Socket error for user ${userId}:`, error);
    });
  });

  // Log server stats periodically
  setInterval(() => {
    const stats = {
      totalConnections: connectionManager.getTotalConnections(),
      onlineUsers: connectionManager.getOnlineUserCount(),
    };
    console.log(`[WebSocket] Server stats:`, stats);
  }, 300000); // Every 5 minutes

  console.log('[WebSocket] Server initialized successfully');
  
  return io;
}

export { connectionManager };
