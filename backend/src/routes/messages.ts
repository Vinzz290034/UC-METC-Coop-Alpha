import express, { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { notificationService } from '../services/notificationService.js';

const router = express.Router();

// Middleware to verify user ID
const verifyUser = (req: Request, res: Response, next: Function) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  (req as any).userId = userId;
  next();
};

// Send message
router.post('/send', verifyUser, async (req: Request, res: Response) => {
  try {
    const { recipientId, recipientRole, subject, content, preview } = req.body;
    const userId = (req as any).userId;

    console.log(`[WebSocket Debug] /messages/send called. Sender ID: ${userId}. Request payload:`, {
      recipientId,
      recipientRole,
      subject,
      preview: preview || (content ? content.substring(0, 50) : '')
    });

    // Get sender info
    const senderResult = await pool.query(
      'SELECT first_name, last_name, role FROM users WHERE id = $1',
      [userId]
    );

    if (senderResult.rows.length === 0) {
      console.warn(`[WebSocket Debug] Sender user not found for ID: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    const sender = senderResult.rows[0];
    const senderName = `${sender.first_name} ${sender.last_name}`;
    console.log(`[WebSocket Debug] Sender info: ${senderName} (${sender.role})`);

    // If sending to a specific person (recipientId provided)
    if (recipientId) {
      console.log(`[WebSocket Debug] Message targeted to a specific recipientId: ${recipientId}`);
      
      // Insert message for specific recipient
      const insertResult = await pool.query(
        `INSERT INTO messages (sender_id, sender_name, sender_role, recipient_id, recipient_role, subject, content, preview, folder, status, is_read)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'inbox', 'unread', false)
         RETURNING id`,
        [userId, senderName, sender.role, recipientId, recipientRole || null, subject, content, preview]
      );
      
      console.log(`[WebSocket Debug] Message inserted in inbox folder. Message ID: ${insertResult.rows[0]?.id}`);

      // Create notification for recipient
      console.log(`[WebSocket Debug] Attempting to trigger notificationService.createNotification for user: ${recipientId}`);
      try {
        const notification = await notificationService.createNotification({
          user_id: recipientId,
          type: 'new_message',
          title: 'New Message',
          description: `${senderName} sent you a message: ${subject}`,
          link: '/inbox',
        });
        if (notification) {
          console.log(`[WebSocket Debug] Notification successfully returned from service:`, {
            id: notification.id,
            user_id: notification.user_id,
            type: notification.type,
            title: notification.title
          });
        } else {
          console.warn(`[WebSocket Debug] Notification service returned null (possibly rate limited or delivery failed internally)`);
        }
      } catch (notifErr) {
        console.error(`[WebSocket Debug] Failed to invoke notificationService.createNotification:`, notifErr);
      }
    } 
    // If sending to a role (admin, staff, user, etc.)
    else if (recipientRole) {
      console.log(`[WebSocket Debug] Message targeted to role: ${recipientRole}`);
      // Get all users with that role
      let targetUsers = [];
      
      if (recipientRole === 'all_users') {
        const usersResult = await pool.query('SELECT id FROM users WHERE role = $1', ['user']);
        targetUsers = usersResult.rows;
      } else if (recipientRole === 'all_members') {
        const membersResult = await pool.query('SELECT id FROM users WHERE membership_status = $1', ['approved']);
        targetUsers = membersResult.rows;
      } else if (recipientRole === 'all_both') {
        const bothResult = await pool.query('SELECT id FROM users WHERE role = $1 OR membership_status = $2', ['user', 'approved']);
        targetUsers = bothResult.rows;
      } else {
        // For specific roles like 'admin', 'staff'
        const roleResult = await pool.query('SELECT id FROM users WHERE role = $1', [recipientRole]);
        targetUsers = roleResult.rows;
      }

      console.log(`[WebSocket Debug] Found ${targetUsers.length} target users matching role ${recipientRole}`);

      // Create inbox message for each target user
      const targetUserIds: string[] = [];
      for (const targetUser of targetUsers) {
        await pool.query(
          `INSERT INTO messages (sender_id, sender_name, sender_role, recipient_id, recipient_role, subject, content, preview, folder, status, is_read)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'inbox', 'unread', false)`,
          [userId, senderName, sender.role, targetUser.id, recipientRole, subject, content, preview]
        );
        targetUserIds.push(targetUser.id);
      }
      console.log(`[WebSocket Debug] Messages inserted in inboxes of target users`);

      // Create notifications for all recipients
      if (targetUserIds.length > 0) {
        console.log(`[WebSocket Debug] Attempting to batch create notifications for users:`, targetUserIds);
        try {
          const notifications = await notificationService.createNotificationsForUsers(
            targetUserIds,
            'new_message',
            'New Message',
            `${senderName} sent you a message: ${subject}`,
            '/inbox'
          );
          console.log(`[WebSocket Debug] Batch notifications created successfully. Total records: ${notifications.length}`);
        } catch (notifErr) {
          console.error(`[WebSocket Debug] Failed to invoke notificationService.createNotificationsForUsers:`, notifErr);
        }
      }
    } else {
      console.warn(`[WebSocket Debug] Message send requested but neither recipientId nor recipientRole was provided in body!`);
    }

    // Insert message in sender's sent folder
    console.log(`[WebSocket Debug] Inserting copy in sender's sent folder...`);
    const sentResult = await pool.query(
      `INSERT INTO messages (sender_id, sender_name, sender_role, recipient_id, recipient_role, subject, content, preview, folder, status, is_read)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'sent', 'read', true)
       RETURNING *`,
      [userId, senderName, sender.role, recipientId || null, recipientRole || null, subject, content, preview]
    );
    console.log(`[WebSocket Debug] Sent folder copy created successfully. Message ID: ${sentResult.rows[0]?.id}`);

    res.json(sentResult.rows[0]);
  } catch (error) {
    console.error('[WebSocket Debug] Fatal exception in /send route:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get user's messages (inbox or sent)
router.get('/', verifyUser, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const folder = (req.query.folder as string) || 'inbox';

    let query = '';
    if (folder === 'inbox') {
      query = `SELECT * FROM messages WHERE recipient_id = $1 AND folder = 'inbox' ORDER BY created_at DESC`;
    } else if (folder === 'sent') {
      query = `SELECT * FROM messages WHERE sender_id = $1 AND folder = 'sent' ORDER BY created_at DESC`;
    } else {
      return res.status(400).json({ error: 'Invalid folder' });
    }

    const result = await pool.query(query, [userId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get specific message
router.get('/:id', verifyUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const result = await pool.query(
      `SELECT * FROM messages WHERE id = $1 AND (recipient_id = $2 OR sender_id = $2)`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch message' });
  }
});

// Mark message as read
router.put('/:id/read', verifyUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const result = await pool.query(
      `UPDATE messages SET is_read = true, status = 'read', updated_at = NOW() 
       WHERE id = $1 AND recipient_id = $2 RETURNING *`,
      [id, userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update message' });
  }
});

// Toggle favorite
router.put('/:id/favorite', verifyUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const result = await pool.query(
      `UPDATE messages SET is_favorite = NOT is_favorite, updated_at = NOW()
       WHERE id = $1 AND (recipient_id = $2 OR sender_id = $2) RETURNING *`,
      [id, userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update message' });
  }
});

// Delete message
router.delete('/:id', verifyUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    await pool.query(
      `DELETE FROM messages WHERE id = $1 AND (recipient_id = $2 OR sender_id = $2)`,
      [id, userId]
    );

    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

export default router;
