import { Router, Request, Response } from 'express';
import { query, pool } from '../config/database.js';
import { authMiddleware, adminMiddleware, invalidateUserCache } from '../middleware/auth.js';
import { User } from '../types/index.js';
import { notificationService } from '../services/notificationService.js';
import { emailService } from '../services/emailService.js';

const router = Router();

// Helper function to check if a user has admin or staff permissions
const isAdminOrStaff = (role?: string) => {
  return role === 'admin' || role === 'staff' || role === 'manager' || role === 'cashier' || role === 'locker_officer' || role === 'inventory_officer';
};



// Get current user profile
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await query(
      'SELECT id, id_number, email, first_name, middle_name, last_name, role, course, year, membership_status, status, tour_completed, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      id_number: user.id_number,
      email: user.email,
      first_name: user.first_name,
      middle_name: user.middle_name,
      last_name: user.last_name,
      role: user.role,
      course: user.course,
      year: user.year,
      membership_status: user.membership_status,
      status: user.status,
      tour_completed: user.tour_completed,
      created_at: user.created_at
    });
  } catch (err) {
    console.error('Error fetching current user:', err);
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
});

// Get all users (admin and staff only)
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Only admin and staff can view all users
    if (!isAdminOrStaff(req.user?.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const result = await query(
      `SELECT id, id_number, email, first_name, middle_name, last_name, role, course, year, membership_status, status, created_at 
       FROM users 
       WHERE role NOT IN ('admin', 'staff') AND email NOT LIKE 'walkin-%@uc-metc-walkin.com'
       ORDER BY created_at DESC`
    );
    
    // Map status to is_active for frontend compatibility
    const users = result.rows.map(user => ({
      ...user,
      is_active: user.status === 'active'
    }));
    
    res.json({ users });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get members only (exclude admin and staff) - admin and staff only
router.get('/members', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Only admin and staff can view members
    if (!isAdminOrStaff(req.user?.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const result = await query(
      `SELECT id, id_number, email, first_name, middle_name, last_name, role, course, year, membership_status, status, created_at 
       FROM users 
       WHERE role NOT IN ('admin', 'staff') AND email NOT LIKE 'walkin-%@uc-metc-walkin.com'
       ORDER BY created_at DESC`
    );
    
    // Map status to is_active for frontend compatibility
    const users = result.rows.map(user => ({
      ...user,
      is_active: user.status === 'active'
    }));
    
    res.json({ users });
  } catch (err) {
    console.error('Error fetching members:', err);
    res.status(500).json({ message: 'Failed to fetch members' });
  }
});

// Get users for messaging (all authenticated users can access)
router.get('/for-messaging/list', authMiddleware, async (req: Request, res: Response) => {
  try {
    // All authenticated users can see the list for messaging purposes
    const result = await query(
      `SELECT id, email, first_name, last_name, role, membership_status, status
       FROM users 
       WHERE status = 'active' AND email NOT LIKE 'walkin-%@uc-metc-walkin.com'
       ORDER BY first_name, last_name`
    );
    
    res.json({ users: result.rows });
  } catch (err) {
    console.error('Error fetching users for messaging:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Users can only view their own profile unless admin
    if (req.user?.id !== id && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const result = await query('SELECT id, email, first_name, last_name, role, membership_status, status, created_at FROM users WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Update user
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { first_name, middle_name, last_name, role, id_number, course, year, tour_completed } = req.body;

    // Users can only update their own profile unless admin/staff
    if (req.user?.id !== id && !isAdminOrStaff(req.user?.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (first_name !== undefined) {
      updates.push(`first_name = $${paramCount}`);
      values.push(first_name);
      paramCount++;
    }

    if (middle_name !== undefined) {
      updates.push(`middle_name = $${paramCount}`);
      values.push(middle_name);
      paramCount++;
    }

    if (last_name !== undefined) {
      updates.push(`last_name = $${paramCount}`);
      values.push(last_name);
      paramCount++;
    }

    if (id_number !== undefined) {
      // Clear id_number if empty string
      updates.push(`id_number = $${paramCount}`);
      values.push(id_number || null);
      paramCount++;
    }

    if (course !== undefined) {
      updates.push(`course = $${paramCount}`);
      values.push(course || null);
      paramCount++;
    }

    if (year !== undefined) {
      updates.push(`year = $${paramCount}`);
      values.push(year || null);
      paramCount++;
    }

    if (role && isAdminOrStaff(req.user?.role)) {
      updates.push(`role = $${paramCount}`);
      values.push(role);
      paramCount++;
    }

    if (tour_completed !== undefined) {
      updates.push(`tour_completed = $${paramCount}`);
      values.push(tour_completed);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(id);
    const query_str = `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING id, email, first_name, middle_name, last_name, role, course, year, membership_status, tour_completed`;

    const result = await query(query_str, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Invalidate user cache to ensure immediate updates across system
    invalidateUserCache(id);

    res.json({ message: 'User updated successfully', user: result.rows[0] });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ message: 'Failed to update user', error: (err as any).message });
  }
});

// ===== MEMBERSHIP REQUESTS ROUTES (must be before :id routes) =====



// Get all pending membership requests (admin and staff only)
router.get('/membership-requests/pending', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Only admin and staff can view pending requests
    if (!isAdminOrStaff(req.user?.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const result = await query(
      `SELECT id, user_id, name, email, phone, status, created_at, updated_at 
       FROM membership_requests 
       WHERE status = 'pending' 
       ORDER BY created_at DESC`
    );
    res.json({ requests: result.rows });
  } catch (err) {
    console.error('Error fetching membership requests:', err);
    res.status(500).json({ message: 'Failed to fetch membership requests' });
  }
});

// Check if current user has a pending membership request
router.get('/membership-requests/my-status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await query(
      'SELECT id, status, created_at FROM membership_requests WHERE user_id = $1 AND status = $2 LIMIT 1',
      [userId, 'pending']
    );

    res.json({ 
      hasPendingRequest: result.rows.length > 0,
      request: result.rows[0] || null
    });
  } catch (err) {
    console.error('Error checking membership request status:', err);
    res.status(500).json({ message: 'Failed to check membership request status' });
  }
});

// Create a new membership request
router.post('/membership-requests', async (req: Request, res: Response) => {
  try {
    const { user_id, name, email, phone } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // Check if user already has a pending or approved membership request
    if (user_id) {
      const existingRequest = await query(
        `SELECT id, status FROM membership_requests WHERE user_id = $1 AND status = 'pending' LIMIT 1`,
        [user_id]
      );

      if (existingRequest.rows.length > 0) {
        return res.status(400).json({ 
          message: 'You already have a pending membership request',
          hasPendingRequest: true
        });
      }

      // Also check if user is already approved
      const userCheck = await query(
        `SELECT membership_status FROM users WHERE id = $1`,
        [user_id]
      );

      if (userCheck.rows.length > 0 && userCheck.rows[0].membership_status === 'approved') {
        return res.status(400).json({ 
          message: 'You are already a member',
          isAlreadyMember: true
        });
      }
    }

    const result = await query(
      `INSERT INTO membership_requests (user_id, name, email, phone, status, created_at) 
       VALUES ($1, $2, $3, $4, 'pending', NOW()) 
       RETURNING id, user_id, name, email, phone, status, created_at`,
      [user_id || null, name, email, phone || null]
    );

    const newRequest = result.rows[0];

    // Notify admin and staff about new membership request
    await notificationService.createNotificationsForRole(
      'admin',
      'pending_membership',
      'New Membership Request',
      `${name} has submitted a membership application`,
      '/members'
    );

    await notificationService.createNotificationsForRole(
      'staff',
      'pending_membership',
      'New Membership Request',
      `${name} has submitted a membership application`,
      '/members'
    );

    res.status(201).json({ 
      message: 'Membership request created successfully', 
      request: newRequest
    });
  } catch (err) {
    console.error('Error creating membership request:', err);
    res.status(500).json({ message: 'Failed to create membership request' });
  }
});



// Approve a membership request (admin and staff only)
router.put('/membership-requests/:requestId/approve', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Only admin and staff can approve requests
    if (!isAdminOrStaff(req.user?.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { requestId } = req.params;

    // Get the membership request
    const requestResult = await query(
      'SELECT id, user_id, name, email, phone, status FROM membership_requests WHERE id = $1',
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ message: 'Membership request not found' });
    }

    const memberRequest = requestResult.rows[0];

    if (memberRequest.status !== 'pending') {
      return res.status(400).json({ message: `Request is already ${memberRequest.status}` });
    }

    let userId = memberRequest.user_id;

    // If no user_id, create a new user account
    if (!userId) {
      // Extract first and last name from the full name
      const nameParts = memberRequest.name.split(' ');
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Create user with a temporary password (hash would be better in production)
      const createUserResult = await query(
        `INSERT INTO users (email, password, first_name, last_name, role, membership_status, status)
         VALUES ($1, $2, $3, $4, 'user', 'approved', 'active')
         RETURNING id, email, first_name, last_name, role, membership_status`,
        [memberRequest.email, 'temp_password_change_required', firstName, lastName]
      );

      userId = createUserResult.rows[0].id;
      console.log('Created new user for membership request:', createUserResult.rows[0]);
    } else {
      // If user exists, update their membership_status to 'approved'
      await query(
        'UPDATE users SET membership_status = $1, updated_at = NOW() WHERE id = $2',
        ['approved', userId]
      );
    }

    // Update the membership request status to approved and link the user
    await query(
      'UPDATE membership_requests SET status = $1, user_id = $2, updated_at = NOW() WHERE id = $3',
      ['approved', userId, requestId]
    );

    // Create notification for user about membership approval
    await notificationService.createNotification({
      user_id: userId,
      type: 'membership_approved',
      title: 'Membership Approved!',
      description: 'Congratulations! Your membership application has been approved. Welcome to UC METC Coop!',
      link: '/dashboard',
    });

    res.json({ 
      message: 'Membership request approved successfully',
      user: {
        id: userId,
        email: memberRequest.email,
        name: memberRequest.name
      }
    });
  } catch (err) {
    console.error('Error approving membership request:', err);
    res.status(500).json({ message: 'Failed to approve membership request' });
  }
});

// Reject a membership request
router.put('/membership-requests/:requestId/reject', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Only admin and staff can reject requests
    if (!isAdminOrStaff(req.user?.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { requestId } = req.params;

    // Get the membership request
    const requestResult = await query(
      'SELECT id, status FROM membership_requests WHERE id = $1',
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ message: 'Membership request not found' });
    }

    const memberRequest = requestResult.rows[0];

    if (memberRequest.status !== 'pending') {
      return res.status(400).json({ message: `Request is already ${memberRequest.status}` });
    }

    // Update the membership request status to rejected
    await query(
      'UPDATE membership_requests SET status = $1, updated_at = NOW() WHERE id = $2',
      ['rejected', requestId]
    );

    // Create notification for user about membership rejection (if user_id exists)
    const rejectedRequest = await query(
      'SELECT user_id FROM membership_requests WHERE id = $1',
      [requestId]
    );
    
    if (rejectedRequest.rows.length > 0 && rejectedRequest.rows[0].user_id) {
      await notificationService.createNotification({
        user_id: rejectedRequest.rows[0].user_id,
        type: 'membership_rejected',
        title: 'Membership Application Update',
        description: 'Your membership application was not approved at this time. Please contact admin for more information.',
        link: '/dashboard',
      });
    }

    res.json({ message: 'Membership request rejected successfully' });
  } catch (err) {
    console.error('Error rejecting membership request:', err);
    res.status(500).json({ message: 'Failed to reject membership request' });
  }
});

// Delete user (admin and staff only)
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Only admin and staff can delete users
    if (!isAdminOrStaff(req.user?.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Only admin and staff can delete members.',
        userRole: req.user?.role 
      });
    }

    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Failed to delete user', error: (err as any).message });
  }
});

// Demote member to user endpoint
router.post('/:id/demote', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Only admin and staff can demote members
    if (!isAdminOrStaff(req.user?.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Only admin and staff can demote members.',
        userRole: req.user?.role 
      });
    }

    // Update user role to 'user' and membership_status to 'pending'
    const result = await query(
      'UPDATE users SET role = $1, membership_status = $2 WHERE id = $3 RETURNING id, first_name, last_name, role, membership_status',
      ['user', 'pending', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Member demoted to user successfully',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Error demoting member:', err);
    res.status(500).json({ message: 'Failed to demote member', error: (err as any).message });
  }
});

// Freeze member account endpoint
router.post('/:id/freeze', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Only admin and staff can freeze accounts
    if (!isAdminOrStaff(req.user?.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Only admin and staff can freeze accounts.',
        userRole: req.user?.role 
      });
    }

    // Update user status to 'inactive'
    const result = await query(
      'UPDATE users SET status = $1 WHERE id = $2 RETURNING id, first_name, last_name, status, membership_status',
      ['inactive', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Invalidate cache to force immediate effect
    invalidateUserCache(id);

    res.json({ 
      message: 'Account frozen successfully',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Error freezing account:', err);
    res.status(500).json({ message: 'Failed to freeze account', error: (err as any).message });
  }
});

// Reactivate user account endpoint
router.post('/:id/reactivate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Only admin and staff can reactivate accounts
    if (!isAdminOrStaff(req.user?.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Only admin and staff can reactivate accounts.',
        userRole: req.user?.role 
      });
    }

    // Update user status to 'active'
    const result = await query(
      'UPDATE users SET status = $1 WHERE id = $2 RETURNING id, first_name, last_name, status, membership_status',
      ['active', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Invalidate cache to allow immediate access
    invalidateUserCache(id);

    res.json({ 
      message: 'Account reactivated successfully',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Error reactivating account:', err);
    res.status(500).json({ message: 'Failed to reactivate account', error: (err as any).message });
  }
});

// Send email endpoint
router.post('/send-email', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { to, subject, body } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ message: 'Email, subject, and body are required' });
    }

    // Get sender info
    const senderId = req.user?.id;
    const senderResult = await pool.query(
      'SELECT first_name, last_name, role, email FROM users WHERE id = $1',
      [senderId]
    );

    if (senderResult.rows.length === 0) {
      return res.status(401).json({ message: 'Sender not found' });
    }

    const sender = senderResult.rows[0];
    const senderName = `${sender.first_name} ${sender.last_name}`;

    // Find recipient by email
    const recipientResult = await pool.query(
      'SELECT id, first_name, last_name, role FROM users WHERE email = $1',
      [to]
    );

    let recipient = null;
    if (recipientResult.rows.length > 0) {
      recipient = recipientResult.rows[0];
    }

    const preview = body.substring(0, 100);

    if (recipient) {
      // Create inbox message for recipient
      await pool.query(
        `INSERT INTO messages (sender_id, sender_name, sender_role, recipient_id, recipient_role, subject, content, preview, folder, status, is_read)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'inbox', 'unread', false)`,
        [senderId, senderName, sender.role, recipient.id, recipient.role, subject, body, preview]
      );

      // Create sent message for sender
      await pool.query(
        `INSERT INTO messages (sender_id, sender_name, sender_role, recipient_id, recipient_role, subject, content, preview, folder, status, is_read)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'sent', 'read', true)`,
        [senderId, senderName, sender.role, recipient.id, recipient.role, subject, body, preview]
      );

      // Create internal in-app notification for the recipient
      try {
        await notificationService.createNotification({
          user_id: recipient.id,
          type: 'new_message',
          title: 'New Message',
          description: `${senderName} sent you a message: ${subject}`,
          link: '/inbox',
        });
      } catch (notifErr) {
        console.error('Failed to create in-app notification:', notifErr);
      }
    } else {
      // Create sent message for sender with NULL recipient (external email only)
      await pool.query(
        `INSERT INTO messages (sender_id, sender_name, sender_role, recipient_id, recipient_role, subject, content, preview, folder, status, is_read)
         VALUES ($1, $2, $3, NULL, NULL, $4, $5, $6, 'sent', 'read', true)`,
        [senderId, senderName, sender.role, subject, body, preview]
      );
    }

    // Send the actual external email using Brevo/SendGrid/SMTP
    try {
      const recipientName = recipient ? `${recipient.first_name} ${recipient.last_name}` : to;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 20px; text-align: center; border-radius: 6px 6px 0 0;">
            <h2 style="margin: 0; font-size: 20px;">New Message</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">UC METC SILMS</p>
          </div>
          <div style="padding: 20px; background-color: #fafafa;">
            <p>Hello <strong>${recipientName}</strong>,</p>
            <p>You have received a new message from the Co-op Administrator (<strong>${senderName}</strong>):</p>
            
            <div style="background-color: #ffffff; border-left: 4px solid #7c3aed; padding: 15px; margin: 15px 0; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
              <h4 style="margin: 0 0 10px 0; color: #4c1d95; font-size: 16px;">Subject: ${subject}</h4>
              <p style="white-space: pre-wrap; margin: 0; color: #4b5563; font-size: 14px;">${body}</p>
            </div>
            
            ${recipient ? `<p style="font-size: 14px;">You can also log in to the portal to reply directly to this message.</p>` : ''}
          </div>
          <div style="text-align: center; color: #9ca3af; font-size: 11px; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
            <p>This is an automated notification from UC METC Sales, Inventory, Locker, and Management System.</p>
            <p>&copy; ${new Date().getFullYear()} UC METC SILMS. All rights reserved.</p>
          </div>
        </div>
      `;
      
      await emailService.sendEmail({
        to,
        subject,
        html: emailHtml
      });
    } catch (emailErr) {
      console.error('Failed to send actual email via service:', emailErr);
    }

    res.json({ 
      message: 'Email sent successfully',
      email: {
        to,
        subject,
        sentAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Error sending email:', err);
    res.status(500).json({ message: 'Failed to send email' });
  }
});

export default router;
