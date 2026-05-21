import { Router, Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dns from 'dns';
import { promisify } from 'util';
import emailValidator from 'email-validator';
import { config } from '../config/config.js';
import { query } from '../config/database.js';
import { User, AuthPayload } from '../types/index.js';
import { emailService } from '../services/emailService.js';

const router = Router();

// Store reset codes temporarily (in production, use Redis or database)
const resetCodes = new Map<string, { code: string; email: string; expiresAt: number }>();

const resolveMx = promisify(dns.resolveMx);

// Helper function to verify email domain exists (checks MX records)
const verifyEmailDomainExists = async (email: string): Promise<boolean> => {
  try {
    const domain = email.split('@')[1];
    const addresses = await resolveMx(domain);
    return addresses && addresses.length > 0;
  } catch (err) {
    return false;
  }
};

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, id_number, password } = req.body;

    // Accept either email or id_number
    if ((!email && !id_number) || !password) {
      return res.status(400).json({ message: 'Email/ID Number and password required' });
    }

    // Query based on whether email or id_number was provided
    let result;
    if (email) {
      result = await query('SELECT * FROM users WHERE email = $1', [email]);
    } else {
      result = await query('SELECT * FROM users WHERE id_number = $1', [id_number]);
    }
    
    const user = result.rows[0] as User;

    if (!user) {
      const errorMsg = id_number ? 'Invalid ID number or password' : 'Invalid email or password';
      return res.status(401).json({ message: errorMsg });
    }

    // Check if user account is active
    if (user.status !== 'active') {
      return res.status(403).json({ 
        message: 'Your account has been deactivated. Please contact an administrator for assistance.' 
      });
    }

    const isValidPassword = await bcryptjs.compare(password, user.password);
    if (!isValidPassword) {
      const errorMsg = id_number ? 'Invalid ID number or password' : 'Invalid email or password';
      return res.status(401).json({ message: errorMsg });
    }

    const payload: AuthPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, config.jwt.secret as string, {
      expiresIn: config.jwt.expiresIn,
    } as any);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        id_number: user.id_number,
        email: user.email,
        first_name: user.first_name,
        middle_name: user.middle_name,
        last_name: user.last_name,
        role: user.role,
        course: user.course,
        year: user.year,
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Login failed' });
  }
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, first_name, middle_name, last_name, role, id_number } = req.body;

    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ message: 'All fields required' });
    }

    // Check if email already exists
    const checkUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (checkUser.rows.length > 0) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // Check if ID number already exists (only if id_number is provided)
    if (id_number) {
      const checkIdNumber = await query('SELECT id FROM users WHERE id_number = $1', [id_number]);
      if (checkIdNumber.rows.length > 0) {
        return res.status(409).json({ message: 'ID number already exists' });
      }
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const userRole = role || 'member';

    const result = await query(
      'INSERT INTO users (id_number, email, password, first_name, middle_name, last_name, role, status, course, year) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, id_number, email, first_name, middle_name, last_name, role, course, year',
      [id_number || null, email, hashedPassword, first_name, middle_name || null, last_name, userRole, 'active', req.body.course || null, req.body.year || null]
    );

    const newUser = result.rows[0];


    res.status(201).json({
      message: 'Account created successfully! Please log in with your credentials.',
      user: {
        id: newUser.id,
        id_number: newUser.id_number,
        email: newUser.email,
        first_name: newUser.first_name,
        middle_name: newUser.middle_name,
        last_name: newUser.last_name,
        role: newUser.role,
        course: newUser.course,
        year: newUser.year,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Request password reset - send code via email
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Validate email format
    if (!emailValidator.validate(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    // Verify email domain actually exists (check MX records)
    const domainExists = await verifyEmailDomainExists(email);
    
    if (!domainExists) {
      return res.status(400).json({ 
        message: 'This email domain does not exist. Please check your email address and try again.' 
      });
    }

    // Check if user exists in database
    const result = await query('SELECT id, email, first_name, last_name FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      // Email exists on internet but not in our database
      return res.status(404).json({ 
        message: 'No account found with this email address. Please register first.' 
      });
    }

    const user = result.rows[0];

    // Generate 6-digit reset code
    const resetCode = crypto.randomInt(100000, 999999).toString();
    
    // Store code with 15-minute expiration
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
    resetCodes.set(email, { code: resetCode, email, expiresAt });

    const userName = `${user.first_name} ${user.last_name}`;
    const emailSent = await emailService.sendPasswordResetEmail(email, resetCode, userName);

    if (!emailSent) {
      return res.status(500).json({ 
        message: 'Failed to send reset code email. Please try again later or contact support.' 
      });
    }

    res.json({ 
      message: 'Reset code sent to your email! Please check your inbox (and spam folder).',
      ...(process.env.NODE_ENV === 'development' && { resetCode })
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to process password reset request' });
  }
});

// Verify reset code
router.post('/verify-reset-code', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required' });
    }

    const storedData = resetCodes.get(email);

    if (!storedData) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    if (storedData.expiresAt < Date.now()) {
      resetCodes.delete(email);
      return res.status(400).json({ message: 'Reset code has expired' });
    }

    if (storedData.code !== code) {
      return res.status(400).json({ message: 'Invalid reset code' });
    }

    res.json({ message: 'Code verified successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to verify reset code' });
  }
});

// Reset password with code
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Email, code, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const storedData = resetCodes.get(email);

    if (!storedData) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    if (storedData.expiresAt < Date.now()) {
      resetCodes.delete(email);
      return res.status(400).json({ message: 'Reset code has expired' });
    }

    if (storedData.code !== code) {
      return res.status(400).json({ message: 'Invalid reset code' });
    }

    // Hash new password
    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    // Update password in database
    await query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE email = $2',
      [hashedPassword, email]
    );

    // Remove used code
    resetCodes.delete(email);

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

export default router;
