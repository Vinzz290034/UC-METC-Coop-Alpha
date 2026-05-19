// WebSocket Connection Manager
// Manages active WebSocket connections and user sessions

import { Socket } from 'socket.io';

interface UserConnection {
  userId: string;
  socketId: string;
  socket: Socket;
  connectedAt: Date;
}

class ConnectionManager {
  private connections: Map<string, UserConnection[]> = new Map();

  /**
   * Add a new connection for a user
   */
  addConnection(userId: string, socket: Socket): void {
    const userConnections = this.connections.get(userId) || [];
    
    const connection: UserConnection = {
      userId,
      socketId: socket.id,
      socket,
      connectedAt: new Date(),
    };

    userConnections.push(connection);
    this.connections.set(userId, userConnections);

    console.log(`[WebSocket] User ${userId} connected (socket: ${socket.id}). Total connections: ${userConnections.length}`);
  }

  /**
   * Remove a connection when socket disconnects
   */
  removeConnection(socketId: string): void {
    for (const [userId, userConnections] of this.connections.entries()) {
      const index = userConnections.findIndex(conn => conn.socketId === socketId);
      
      if (index !== -1) {
        userConnections.splice(index, 1);
        
        if (userConnections.length === 0) {
          this.connections.delete(userId);
          console.log(`[WebSocket] User ${userId} fully disconnected (socket: ${socketId})`);
        } else {
          this.connections.set(userId, userConnections);
          console.log(`[WebSocket] User ${userId} connection removed (socket: ${socketId}). Remaining: ${userConnections.length}`);
        }
        
        return;
      }
    }
  }

  /**
   * Get all active sockets for a user
   */
  getUserSockets(userId: string): Socket[] {
    const userConnections = this.connections.get(userId) || [];
    return userConnections.map(conn => conn.socket);
  }

  /**
   * Check if a user is online (has at least one active connection)
   */
  isUserOnline(userId: string): boolean {
    const userConnections = this.connections.get(userId);
    return userConnections !== undefined && userConnections.length > 0;
  }

  /**
   * Get total number of active connections
   */
  getTotalConnections(): number {
    let total = 0;
    for (const userConnections of this.connections.values()) {
      total += userConnections.length;
    }
    return total;
  }

  /**
   * Get number of unique users online
   */
  getOnlineUserCount(): number {
    return this.connections.size;
  }

  /**
   * Get all online user IDs
   */
  getOnlineUserIds(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Emit event to all connections of a specific user
   */
  emitToUser(userId: string, event: string, data: any): void {
    const sockets = this.getUserSockets(userId);
    sockets.forEach(socket => {
      socket.emit(event, data);
    });
  }

  /**
   * Emit event to multiple users
   */
  emitToUsers(userIds: string[], event: string, data: any): void {
    userIds.forEach(userId => {
      this.emitToUser(userId, event, data);
    });
  }

  /**
   * Broadcast event to all connected users
   */
  broadcastToAll(event: string, data: any): void {
    for (const userConnections of this.connections.values()) {
      userConnections.forEach(conn => {
        conn.socket.emit(event, data);
      });
    }
  }
}

export const connectionManager = new ConnectionManager();
