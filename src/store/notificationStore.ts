// Notification Store - Zustand State Management
// Manages notification state and WebSocket integration

import create from 'zustand';
import type { Notification } from '../types';
import { websocketClient } from '../services/websocketClient';
import { apiClient } from '../services/api';

interface NotificationState {
  // State
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;

  // Actions
  initialize: (token: string, userId: string) => Promise<void>;
  cleanup: () => void;
  addNotification: (notification: Notification) => void;
  setNotifications: (notifications: Notification[]) => void;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  incrementUnreadCount: () => void;
  decrementUnreadCount: () => void;
  setConnectionStatus: (connected: boolean) => void;
  startPolling: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  // Initial state
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isConnected: false,
  error: null,

  initialize: async (token: string, userId: string) => {
    console.log('[NotificationStore] Initializing for user:', userId);
    
    // Connect to WebSocket
    websocketClient.connect(token);

    // Setup WebSocket event listeners
    websocketClient.on('new_notification', (notification: Notification) => {
      console.log('[NotificationStore] New notification received:', notification);
      get().addNotification(notification);
    });

    websocketClient.on('notification_read', (data: { notificationId: string }) => {
      console.log('[NotificationStore] Notification marked as read:', data.notificationId);
      // Update local state
      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === data.notificationId ? { ...n, is_read: true } : n
        ),
      }));
      get().decrementUnreadCount();
    });

    websocketClient.on('notifications_all_read', (data: { count: number }) => {
      console.log('[NotificationStore] All notifications marked as read. Count:', data.count);
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0,
      }));
    });

    websocketClient.on('notification_deleted', (data: { notificationId: string }) => {
      console.log('[NotificationStore] Notification deleted:', data.notificationId);
      set(state => ({
        notifications: state.notifications.filter(n => n.id !== data.notificationId),
      }));
    });

    websocketClient.on('connection_status', (data: { connected: boolean }) => {
      console.log('[NotificationStore] Connection status:', data.connected);
      get().setConnectionStatus(data.connected);
    });

    websocketClient.on('connection_failed', () => {
      console.error('[NotificationStore] Connection failed, falling back to polling');
      get().setConnectionStatus(false);
      // Start polling as fallback
      get().startPolling();
    });

    // Load initial notifications
    await get().fetchNotifications();
    await get().fetchUnreadCount();
  },

  // Cleanup WebSocket connection
  cleanup: () => {
    console.log('[NotificationStore] Cleaning up...');
    websocketClient.disconnect();
    set({
      notifications: [],
      unreadCount: 0,
      isConnected: false,
      error: null,
    });
  },

  // Add a new notification to the list
  addNotification: (notification: Notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));

    // Acknowledge receipt
    websocketClient.acknowledgeNotification(notification.id);
  },

  // Set notifications list
  setNotifications: (notifications: Notification[]) => {
    set({ notifications });
  },

  // Mark a notification as read
  markAsRead: async (notificationId: string) => {
    try {
      // Optimistically update UI
      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        ),
      }));
      get().decrementUnreadCount();

      // Call API
      await apiClient.markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('[NotificationStore] Error marking as read:', error);
      // Revert optimistic update
      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === notificationId ? { ...n, is_read: false } : n
        ),
      }));
      get().incrementUnreadCount();
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const previousNotifications = get().notifications;
    const previousUnreadCount = get().unreadCount;
    try {
      // Optimistically update UI
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0,
      }));

      // Call API
      await apiClient.markAllNotificationsAsRead();
    } catch (error) {
      console.error('[NotificationStore] Error marking all as read:', error);
      // Revert optimistic update
      set({
        notifications: previousNotifications,
        unreadCount: previousUnreadCount,
      });
    }
  },

  // Delete a notification
  deleteNotification: async (notificationId: string) => {
    try {
      const notification = get().notifications.find(n => n.id === notificationId);
      
      // Optimistically update UI
      set(state => ({
        notifications: state.notifications.filter(n => n.id !== notificationId),
        unreadCount: notification && !notification.is_read 
          ? state.unreadCount - 1 
          : state.unreadCount,
      }));

      // Call API
      await apiClient.deleteNotification(notificationId);
    } catch (error) {
      console.error('[NotificationStore] Error deleting notification:', error);
      // Reload notifications on error
      await get().fetchNotifications();
    }
  },

  // Fetch notifications from API
  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.getNotifications(20, 0) as any;
      set({
        notifications: response.data.notifications,
        unreadCount: response.data.unreadCount,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('[NotificationStore] Error fetching notifications:', error);
      set({
        error: error.message || 'Failed to load notifications',
        isLoading: false,
      });
    }
  },

  // Fetch unread count from API
  fetchUnreadCount: async () => {
    try {
      const response = await apiClient.getUnreadNotificationCount() as any;
      set({ unreadCount: response.data.count });
    } catch (error) {
      console.error('[NotificationStore] Error fetching unread count:', error);
    }
  },

  // Increment unread count
  incrementUnreadCount: () => {
    set(state => ({ unreadCount: state.unreadCount + 1 }));
  },

  // Decrement unread count
  decrementUnreadCount: () => {
    set(state => ({ unreadCount: Math.max(0, state.unreadCount - 1) }));
  },

  // Set connection status
  setConnectionStatus: (connected: boolean) => {
    set({ isConnected: connected });
  },

  // Polling fallback (if WebSocket fails)
  startPolling: () => {
    const pollInterval = setInterval(async () => {
      if (get().isConnected) {
        clearInterval(pollInterval);
        return;
      }
      await get().fetchNotifications();
      await get().fetchUnreadCount();
    }, 30000); // Poll every 30 seconds
  },
}));
