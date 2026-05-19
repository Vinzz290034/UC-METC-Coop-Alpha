// Notification API Routes

import express, { Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { notificationService } from '../services/notificationService.js';

const router = express.Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * GET /api/notifications
 * Get notifications for the authenticated user
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const unreadOnly = req.query.unreadOnly === 'true';

    const result = await notificationService.getNotifications(userId, limit, offset, unreadOnly);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Notifications API] Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
    });
  }
});

/**
 * GET /api/notifications/unread-count
 * Get unread notification count for the authenticated user
 */
router.get('/unread-count', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const count = await notificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error('[Notifications API] Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
    });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read
 */
router.put('/:id/read', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const notificationId = req.params.id;

    const success = await notificationService.markAsRead(notificationId, userId);

    if (success) {
      res.json({
        success: true,
        message: 'Notification marked as read',
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }
  } catch (error) {
    console.error('[Notifications API] Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
    });
  }
});

/**
 * PUT /api/notifications/mark-all-read
 * Mark all notifications as read for the authenticated user
 */
router.put('/mark-all-read', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const count = await notificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: `Marked ${count} notifications as read`,
      data: { count },
    });
  } catch (error) {
    console.error('[Notifications API] Error marking all as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
    });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const notificationId = req.params.id;

    const success = await notificationService.deleteNotification(notificationId, userId);

    if (success) {
      res.json({
        success: true,
        message: 'Notification deleted',
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }
  } catch (error) {
    console.error('[Notifications API] Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
    });
  }
});

/**
 * POST /api/notifications/cleanup
 * Manual cleanup endpoint for administrators
 */
router.post('/cleanup', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required',
      });
    }

    const daysOld = parseInt(req.body.daysOld) || 30;
    const count = await notificationService.deleteOldNotifications(daysOld);

    res.json({
      success: true,
      message: `Deleted ${count} old notifications`,
      data: { count, daysOld },
    });
  } catch (error) {
    console.error('[Notifications API] Error during cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup notifications',
    });
  }
});

export default router;
