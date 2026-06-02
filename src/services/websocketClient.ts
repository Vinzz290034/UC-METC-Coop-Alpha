// WebSocket Client Service
// Manages WebSocket connection to backend for real-time notifications

import { io, Socket } from 'socket.io-client';
import { getWebSocketUrl } from '../utils/apiBaseUrl';

const BACKEND_URL = getWebSocketUrl();

class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private isConnecting = false;
  private listeners: Map<string, Set<Function>> = new Map();

  /**
   * Connect to WebSocket server with JWT token
   */
  connect(token: string): void {
    if (this.socket?.connected || this.isConnecting) {
      console.log('[WebSocket] Already connected or connecting');
      return;
    }

    this.isConnecting = true;
    console.log('[WebSocket] Connecting to server...');

    this.socket = io(BACKEND_URL, {
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventHandlers();
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      console.log('[WebSocket] Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
      this.reconnectAttempts = 0;
      this.isConnecting = false;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Subscribe to an event
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // If socket is already connected, attach the listener
    if (this.socket) {
      this.socket.on(event, callback as any);
    }
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }

    if (this.socket) {
      this.socket.off(event, callback as any);
    }
  }

  /**
   * Emit an event to server
   */
  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('[WebSocket] Cannot emit, not connected');
    }
  }

  /**
   * Setup event handlers for socket
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection successful
    this.socket.on('connected', (data: any) => {
      console.log('[WebSocket] Connected successfully:', data);
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;

      // Re-attach all listeners
      for (const [event, callbacks] of this.listeners.entries()) {
        callbacks.forEach(callback => {
          this.socket!.on(event, callback as any);
        });
      }

      this.notifyListeners('connection_status', { connected: true });
    });

    // Connection error
    this.socket.on('connect_error', (error: Error) => {
      console.error('[WebSocket] Connection error:', error.message);
      this.isConnecting = false;
      this.handleReconnect();
    });

    // Disconnected
    this.socket.on('disconnect', (reason: string) => {
      console.log('[WebSocket] Disconnected:', reason);
      this.notifyListeners('connection_status', { connected: false });

      // Attempt reconnection if not a manual disconnect
      if (reason !== 'io client disconnect') {
        this.handleReconnect();
      }
    });

    // Reconnection attempt
    this.socket.on('reconnect_attempt', (attemptNumber: number) => {
      console.log(`[WebSocket] Reconnection attempt ${attemptNumber}/${this.maxReconnectAttempts}`);
    });

    // Reconnection failed
    this.socket.on('reconnect_failed', () => {
      console.error('[WebSocket] Reconnection failed after maximum attempts');
      this.notifyListeners('connection_failed', {});
    });

    // Pong response
    this.socket.on('pong', (_data: any) => {
      // Health check response
    });
  }

  /**
   * Handle reconnection with exponential backoff
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached');
      this.notifyListeners('connection_failed', {});
      return;
    }

    this.reconnectAttempts++;
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 10000); // Exponential backoff, max 10s

    console.log(`[WebSocket] Will attempt reconnection in ${this.reconnectDelay}ms`);
  }

  /**
   * Notify all listeners of an event
   */
  private notifyListeners(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  /**
   * Send ping to check connection health
   */
  ping(): void {
    this.emit('ping');
  }

  /**
   * Acknowledge notification receipt
   */
  acknowledgeNotification(notificationId: string): void {
    this.emit('notification_received', { notificationId });
  }
}

// Export singleton instance
export const websocketClient = new WebSocketClient();
