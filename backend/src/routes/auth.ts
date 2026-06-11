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

// Store email verification codes + pending registration data temporarily
// User is NOT inserted into the DB until they verify the OTP
interface PendingRegistration {
  code: string;
  email: string;
  expiresAt: number;
  registrationData: {
    id_number: string | null;
    email: string;
    hashedPassword: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    role: string;
    status: string;
    course: string | null;
    year: string | null;
  };
}
const pendingRegistrations = new Map<string, PendingRegistration>();

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

// Helper: wrap a promise with a timeout to prevent hanging
const withTimeout = <T>(promise: Promise<T>, ms: number, fallbackValue: T): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallbackValue), ms))
  ]);
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

    // Check if email is verified (only for student/user accounts, not admin/staff)
    if (user.role === 'user' && (user as any).email_verified === false) {
      return res.status(403).json({ 
        message: 'Please verify your email address before logging in. Check your inbox for the verification code.',
        requiresVerification: true,
        email: user.email
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
        membership_status: user.membership_status,
        tour_completed: user.tour_completed,
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

    // Validate email format syntax
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

    // Check if email already exists in DB
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

    // Hash password now, but DO NOT insert user into DB yet
    const hashedPassword = await bcryptjs.hash(password, 10);
    const userRole = role || 'user';

    // Generate 6-digit OTP
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Store pending registration (overwrite if they re-register with same email)
    pendingRegistrations.set(email, {
      code: verificationCode,
      email,
      expiresAt,
      registrationData: {
        id_number: id_number || null,
        email,
        hashedPassword,
        first_name,
        middle_name: middle_name || null,
        last_name,
        role: userRole,
        status: 'active',
        course: req.body.course || null,
        year: req.body.year || null,
      }
    });

    // Send OTP verification email
    const emailSent = await withTimeout(
      emailService.sendVerificationEmail(email, verificationCode, first_name),
      10000,
      false
    );

    console.log(`[REGISTER] Pending registration for ${email}. Verification email sent: ${emailSent}`);

    res.status(200).json({
      message: 'Please check your email for the verification code to complete registration.',
      requiresVerification: true,
      email
    });
  } catch (err) {
    console.error('[REGISTER ERROR]:', err);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Verify email with OTP code — this is where the user is actually created in the DB
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and verification code are required' });
    }

    const pending = pendingRegistrations.get(email);

    if (!pending) {
      return res.status(400).json({ message: 'Invalid or expired verification code. Please register again.' });
    }

    if (pending.expiresAt < Date.now()) {
      pendingRegistrations.delete(email);
      return res.status(400).json({ message: 'Verification code has expired. Please register again.' });
    }

    if (pending.code !== code) {
      return res.status(400).json({ message: 'Invalid verification code. Please check and try again.' });
    }

    // OTP is correct — now insert the user into the database
    const { registrationData: rd } = pending;

    // Double-check email hasn't been taken while they were verifying
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [rd.email]);
    if (existingUser.rows.length > 0) {
      pendingRegistrations.delete(email);
      return res.status(409).json({ message: 'Email already exists. Please log in or reset your password.' });
    }

    try {
      await query(
        'INSERT INTO users (id_number, email, password, first_name, middle_name, last_name, role, status, course, year, email_verified) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
        [rd.id_number, rd.email, rd.hashedPassword, rd.first_name, rd.middle_name, rd.last_name, rd.role, rd.status, rd.course, rd.year, true]
      );
    } catch (dbErr: any) {
      if (dbErr.code === '23505') { // PostgreSQL unique violation code
        const detail = dbErr.detail || '';
        if (detail.includes('id_number')) {
          return res.status(409).json({ message: 'This ID Number is already registered to another account.' });
        }
        if (detail.includes('email')) {
          return res.status(409).json({ message: 'This email address is already registered.' });
        }
      }
      throw dbErr;
    }

    // Remove pending registration
    pendingRegistrations.delete(email);

    console.log(`[VERIFY EMAIL] User ${email} successfully registered and verified.`);
    res.json({ message: 'Email verified successfully! You can now log in.' });
  } catch (err) {
    console.error('[VERIFY EMAIL ERROR]:', err);
    res.status(500).json({ message: 'Failed to verify email' });
  }
});

// Resend verification code for pending registration
router.post('/resend-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const pending = pendingRegistrations.get(email);
    if (!pending) {
      return res.status(404).json({ message: 'No pending registration found. Please register again.' });
    }

    // Generate new 6-digit code and refresh expiry
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    pending.code = verificationCode;
    pending.expiresAt = Date.now() + 15 * 60 * 1000;
    pendingRegistrations.set(email, pending);

    const emailSent = await withTimeout(
      emailService.sendVerificationEmail(email, verificationCode, pending.registrationData.first_name),
      10000,
      false
    );

    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send verification email. Please try again later.' });
    }

    res.json({ 
      message: 'New verification code sent! Please check your inbox.'
    });
  } catch (err) {
    console.error('[RESEND VERIFICATION ERROR]:', err);
    res.status(500).json({ message: 'Failed to resend verification code' });
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

    // Check if user exists in database
    const result = await query('SELECT id, email, first_name, last_name FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
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
    
    // Send email with a 15-second timeout to prevent hanging
    const emailSent = await withTimeout(
      emailService.sendPasswordResetEmail(email, resetCode, userName),
      15000,
      false
    );

    if (!emailSent) {
      return res.status(500).json({ 
        message: 'Failed to send reset code email. Please try again later or contact support.' 
      });
    }

    res.json({ 
      message: 'Reset code sent to your email! Please check your inbox (and spam folder).'
    });
  } catch (err) {
    console.error('[FORGOT PASSWORD ERROR]:', err);
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
