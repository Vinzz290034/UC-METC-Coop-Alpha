import { Router, Request, Response } from 'express';
import { query } from '../config/database.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { User } from '../types/index.js';

const router = Router();

// Helper function to check if a user has admin or staff permissions
const isAdminOrStaff = (role?: string) => {
  return role === 'admin' || role === 'manager' || role === 'cashier' || role === 'locker_officer' || role === 'inventory_officer';
};

// Test endpoint - get all users WITHOUT auth (for debugging)
router.get('/test-get-all', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT id, email, first_name, last_name, role, membership_status, status, created_at FROM users ORDER BY created_at DESC');
    res.json({ users: result.rows });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Test endpoint - check current user auth status
router.get('/me/test', authMiddleware, async (req: Request, res: Response) => {
  try {
    res.json({
      message: 'Auth token is valid',
      user: req.user,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Failed to verify auth' });
  }
});

// Get current user profile
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await query(
      'SELECT id, id_number, email, first_name, middle_name, last_name, role, course, year, membership_status, status, created_at FROM users WHERE id = $1',
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
    
    const result = await query('SELECT id, email, first_name, last_name, role, membership_status, status, created_at FROM users ORDER BY created_at DESC');
    res.json({ users: result.rows });
  } catch (err) {
    console.error('Error fetching users:', err);
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
    const { first_name, last_name, role } = req.body;

    console.log('PUT /users/:id request:', {
      targetUserId: id,
      requestingUser: { id: req.user?.id, role: req.user?.role },
      updateData: { first_name, last_name, role }
    });

    // Users can only update their own profile unless admin/staff
    if (req.user?.id !== id && !isAdminOrStaff(req.user?.role)) {
      console.log('Access denied: User cannot update this profile');
      return res.status(403).json({ message: 'Access denied' });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (first_name) {
      updates.push(`first_name = $${paramCount}`);
      values.push(first_name);
      paramCount++;
    }

    if (last_name) {
      updates.push(`last_name = $${paramCount}`);
      values.push(last_name);
      paramCount++;
    }

    if (role && isAdminOrStaff(req.user?.role)) {
      updates.push(`role = $${paramCount}`);
      values.push(role);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(id);
    const query_str = `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING id, email, first_name, last_name, role, membership_status`;

    console.log('Executing query:', query_str, 'with values:', values);

    const result = await query(query_str, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User updated successfully:', result.rows[0]);
    res.json({ message: 'User updated successfully', user: result.rows[0] });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ message: 'Failed to update user', error: (err as any).message });
  }
});

// ===== MEMBERSHIP REQUESTS ROUTES (must be before :id routes) =====

// Test endpoint - get all pending requests WITHOUT auth (for debugging)
router.get('/membership-requests/pending-test', async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, user_id, name, email, phone, status, created_at, updated_at 
       FROM membership_requests 
       WHERE status = 'pending' 
       ORDER BY created_at DESC`
    );
    res.json({ requests: result.rows, debug: `Found ${result.rows.length} pending requests` });
  } catch (err) {
    console.error('Error fetching membership requests:', err);
    res.status(500).json({ message: 'Failed to fetch membership requests' });
  }
});

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

// Create a new membership request
router.post('/membership-requests', async (req: Request, res: Response) => {
  try {
    const { user_id, name, email, phone } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const result = await query(
      `INSERT INTO membership_requests (user_id, name, email, phone, status, created_at) 
       VALUES ($1, $2, $3, $4, 'pending', NOW()) 
       RETURNING id, user_id, name, email, phone, status, created_at`,
      [user_id || null, name, email, phone || null]
    );

    res.status(201).json({ 
      message: 'Membership request created successfully', 
      request: result.rows[0] 
    });
  } catch (err) {
    console.error('Error creating membership request:', err);
    res.status(500).json({ message: 'Failed to create membership request' });
  }
});

// Approve a membership request - TEST VERSION (no auth)
router.put('/membership-requests/:requestId/approve-test', async (req: Request, res: Response) => {
  try {
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

// Reject a membership request - TEST VERSION (no auth)
router.put('/membership-requests/:requestId/reject-test', async (req: Request, res: Response) => {
  try {
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

    res.json({ message: 'Membership request rejected successfully' });
  } catch (err) {
    console.error('Error rejecting membership request:', err);
    res.status(500).json({ message: 'Failed to reject membership request' });
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

    console.log('DELETE /users/:id request:', {
      targetUserId: id,
      requestingUser: { id: req.user?.id, role: req.user?.role },
      timestamp: new Date().toISOString()
    });

    // Only admin and staff can delete users
    if (!isAdminOrStaff(req.user?.role)) {
      console.error('Authorization failed: User role not authorized for deletion', {
        userRole: req.user?.role,
        isAdminOrStaff: isAdminOrStaff(req.user?.role)
      });
      return res.status(403).json({ 
        message: 'Access denied. Only admin and staff can delete members.',
        userRole: req.user?.role 
      });
    }

    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      console.error('Delete failed: User not found', { id });
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User deleted successfully:', { id });
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

    console.log('POST /users/:id/demote request:', {
      targetUserId: id,
      requestingUser: { id: req.user?.id, role: req.user?.role },
      timestamp: new Date().toISOString()
    });

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

    console.log('Member demoted successfully:', result.rows[0]);
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

    console.log('POST /users/:id/freeze request:', {
      targetUserId: id,
      requestingUser: { id: req.user?.id, role: req.user?.role },
      timestamp: new Date().toISOString()
    });

    // Only admin and staff can freeze accounts
    if (!isAdminOrStaff(req.user?.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Only admin and staff can freeze accounts.',
        userRole: req.user?.role 
      });
    }

    // Update user status to 'frozen'
    const result = await query(
      'UPDATE users SET status = $1 WHERE id = $2 RETURNING id, first_name, last_name, status, membership_status',
      ['frozen', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Account frozen successfully:', result.rows[0]);
    res.json({ 
      message: 'Account frozen successfully',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Error freezing account:', err);
    res.status(500).json({ message: 'Failed to freeze account', error: (err as any).message });
  }
});

// Send email endpoint
router.post('/send-email', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { to, subject, body } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ message: 'Email, subject, and body are required' });
    }

    // Log the email (in production, integrate with nodemailer, SendGrid, etc.)
    console.log('📧 Email sent:', {
      from: req.user?.email,
      to,
      subject,
      body,
      timestamp: new Date().toISOString()
    });

    // TODO: Integration with email service
    // Example with nodemailer:
    // const transporter = nodemailer.createTransport({ ... });
    // await transporter.sendMail({
    //   from: process.env.EMAIL_FROM,
    //   to,
    //   subject,
    //   html: body
    // });

    res.json({ 
      message: 'Email sent successfully',
      email: {
        to,
        subject,
        sentAt: new Date().toISOString(),
        note: 'Email functionality is in demo mode. Integrate with a real email service for full functionality.'
      }
    });
  } catch (err) {
    console.error('Error sending email:', err);
    res.status(500).json({ message: 'Failed to send email' });
  }
});

export default router;
