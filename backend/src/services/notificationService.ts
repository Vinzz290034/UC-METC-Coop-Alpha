// Notification Service
// Handles notification creation, retrieval, and delivery

import { pool } from '../config/database.js';
import { connectionManager } from '../websocket/connectionManager.js';
import type { Notification, CreateNotificationInput, NotificationType } from '../types/notification.js';

class NotificationService {
  // Rate limiting: Track notification counts per user
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly MAX_NOTIFICATIONS_PER_MINUTE = 10;

  /**
   * Create a single notification for a user
   */
  async createNotification(input: CreateNotificationInput): Promise<Notification | null> {
    // Check rate limit
    if (!this.checkRateLimit(input.user_id)) {
      console.warn(`[NotificationService] Rate limit exceeded for user ${input.user_id}`);
      return null;
    }

    try {
      const query = `
        INSERT INTO notifications (user_id, type, title, description, link)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const values = [
        input.user_id,
        input.type,
        input.title,
        input.description || null,
        input.link || null,
      ];

      const result = await pool.query(query, values);
      const notification = result.rows[0] as Notification;

      console.log(`[NotificationService] Created notification ${notification.id} for user ${input.user_id}`);

      // Deliver notification in real-time if user is online
      this.deliverNotification(notification);

      return notification;
    } catch (error) {
      console.error('[NotificationService] Error creating notification:', error);
      return null;
    }
  }

  /**
   * Create notifications for multiple users (batch operation)
   */
  async createNotificationsForUsers(
    userIds: string[],
    type: NotificationType,
    title: string,
    description?: string,
    link?: string
  ): Promise<Notification[]> {
    if (userIds.length === 0) return [];

    try {
      // Build batch insert query
      const values: any[] = [];
      const placeholders: string[] = [];

      userIds.forEach((userId, index) => {
        const offset = index * 5;
        placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`);
        values.push(userId, type, title, description || null, link || null);
      });

      const query = `
        INSERT INTO notifications (user_id, type, title, description, link)
        VALUES ${placeholders.join(', ')}
        RETURNING *
      `;

      const result = await pool.query(query, values);
      const notifications = result.rows as Notification[];

      console.log(`[NotificationService] Created ${notifications.length} notifications for ${userIds.length} users`);

      // Deliver notifications to online users
      notifications.forEach(notification => {
        this.deliverNotification(notification);
      });

      return notifications;
    } catch (error) {
      console.error('[NotificationService] Error creating batch notifications:', error);
      return [];
    }
  }

  /**
   * Create notifications for all users with a specific role
   */
  async createNotificationsForRole(
    role: 'admin' | 'staff',
    type: NotificationType,
    title: string,
    description?: string,
    link?: string
  ): Promise<Notification[]> {
    try {
      // Get all user IDs with the specified role
      const userQuery = `SELECT id FROM users WHERE role = $1 AND status = 'active'`;
      const userResult = await pool.query(userQuery, [role]);
      const userIds = userResult.rows.map(row => row.id);

      if (userIds.length === 0) {
        console.log(`[NotificationService] No users found with role ${role}`);
        return [];
      }

      return await this.createNotificationsForUsers(userIds, type, title, description, link);
    } catch (error) {
      console.error('[NotificationService] Error creating role-based notifications:', error);
      return [];
    }
  }

  /**
   * Get notifications for a user with pagination
   */
  async getNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0,
    unreadOnly: boolean = false
  ): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    try {
      const whereClause = unreadOnly ? 'WHERE user_id = $1 AND is_read = FALSE' : 'WHERE user_id = $1';

      // Get notifications
      const notificationsQuery = `
        SELECT * FROM notifications
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;
      const notificationsResult = await pool.query(notificationsQuery, [userId, limit, offset]);

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM notifications ${whereClause}`;
      const countResult = await pool.query(countQuery, [userId]);
      const total = parseInt(countResult.rows[0].total);

      // Get unread count
      const unreadQuery = `SELECT COUNT(*) as unread FROM notifications WHERE user_id = $1 AND is_read = FALSE`;
      const unreadResult = await pool.query(unreadQuery, [userId]);
      const unreadCount = parseInt(unreadResult.rows[0].unread);

      return {
        notifications: notificationsResult.rows as Notification[],
        total,
        unreadCount,
      };
    } catch (error) {
      console.error('[NotificationService] Error fetching notifications:', error);
      return { notifications: [], total: 0, unreadCount: 0 };
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const query = `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE`;
      const result = await pool.query(query, [userId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('[NotificationService] Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const query = `
        UPDATE notifications
        SET is_read = TRUE
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `;
      const result = await pool.query(query, [notificationId, userId]);

      if (result.rows.length > 0) {
        console.log(`[NotificationService] Marked notification ${notificationId} as read`);
        
        // Emit event to update UI
        connectionManager.emitToUser(userId, 'notification_read', { notificationId });
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('[NotificationService] Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    try {
      const query = `
        UPDATE notifications
        SET is_read = TRUE
        WHERE user_id = $1 AND is_read = FALSE
        RETURNING id
      `;
      const result = await pool.query(query, [userId]);
      const count = result.rows.length;

      console.log(`[NotificationService] Marked ${count} notifications as read for user ${userId}`);

      // Emit event to update UI
      connectionManager.emitToUser(userId, 'notifications_all_read', { count });

      return count;
    } catch (error) {
      console.error('[NotificationService] Error marking all as read:', error);
      return 0;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      const query = `DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id`;
      const result = await pool.query(query, [notificationId, userId]);

      if (result.rows.length > 0) {
        console.log(`[NotificationService] Deleted notification ${notificationId}`);
        
        // Emit event to update UI
        connectionManager.emitToUser(userId, 'notification_deleted', { notificationId });
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('[NotificationService] Error deleting notification:', error);
      return false;
    }
  }

  /**
   * Delete old notifications (cleanup job)
   */
  async deleteOldNotifications(daysOld: number = 30): Promise<number> {
    try {
      const query = `
        DELETE FROM notifications
        WHERE created_at < NOW() - INTERVAL '${daysOld} days'
        RETURNING id
      `;
      const result = await pool.query(query);
      const count = result.rows.length;

      console.log(`[NotificationService] Deleted ${count} notifications older than ${daysOld} days`);

      return count;
    } catch (error) {
      console.error('[NotificationService] Error deleting old notifications:', error);
      return 0;
    }
  }

  /**
   * Deliver notification to user via WebSocket
   */
  private deliverNotification(notification: Notification): void {
    if (connectionManager.isUserOnline(notification.user_id)) {
      connectionManager.emitToUser(notification.user_id, 'new_notification', notification);
      console.log(`[NotificationService] Delivered notification ${notification.id} to user ${notification.user_id} via WebSocket`);
    } else {
      console.log(`[NotificationService] User ${notification.user_id} is offline, notification stored for later`);
    }
  }

  /**
   * Check rate limit for a user
   */
  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userLimit = this.rateLimitMap.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      // Reset or initialize rate limit
      this.rateLimitMap.set(userId, {
        count: 1,
        resetTime: now + 60000, // 1 minute from now
      });
      return true;
    }

    if (userLimit.count >= this.MAX_NOTIFICATIONS_PER_MINUTE) {
      return false;
    }

    userLimit.count++;
    return true;
  }

  /**
   * Clean up rate limit map periodically
   */
  cleanupRateLimitMap(): void {
    const now = Date.now();
    for (const [userId, limit] of this.rateLimitMap.entries()) {
      if (now > limit.resetTime) {
        this.rateLimitMap.delete(userId);
      }
    }
  }
}

export const notificationService = new NotificationService();

// Clean up rate limit map every 5 minutes
setInterval(() => {
  notificationService.cleanupRateLimitMap();
}, 300000);
