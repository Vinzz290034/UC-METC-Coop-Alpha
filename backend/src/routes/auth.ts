import { Router, Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import { query } from '../config/database.js';
import { User, AuthPayload } from '../types/index.js';

const router = Router();

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

    const isValidPassword = await bcryptjs.compare(password, user.password);
    if (!isValidPassword) {
      console.error('Password mismatch for user:', email || id_number);
      const errorMsg = id_number ? 'Invalid ID number or password' : 'Invalid email or password';
      return res.status(401).json({ message: errorMsg });
    }

    const payload: AuthPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    console.log('[LOGIN] Before signing token:', {
      secretLength: config.jwt.secret.length,
      secretValue: config.jwt.secret,
      secretPrefix: config.jwt.secret.substring(0, 20) + '...',
      payload
    });

    const token = jwt.sign(payload, config.jwt.secret as string, {
      expiresIn: config.jwt.expiresIn,
    } as any);

    // Decode token to verify expiration was set correctly
    const decoded = jwt.decode(token) as any;
    const expiresAt = new Date(decoded.exp * 1000);
    const now = new Date();
    const expiresIn = Math.floor((expiresAt.getTime() - now.getTime()) / 1000 / 60 / 60 / 24); // days

    console.log('[LOGIN] Token generated successfully:', {
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      expiresIn: `${expiresIn} days`,
      expiresAt: expiresAt.toISOString(),
      configExpiry: config.jwt.expiresIn,
      secretLength: config.jwt.secret.length,
      secretValue: config.jwt.secret
    });

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
    console.error('Login error:', err?.message || err);
    res.status(500).json({ message: 'Login failed', error: err?.message });
  }
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, first_name, middle_name, last_name, role, id_number } = req.body;

    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ message: 'All fields required' });
    }

    const checkUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (checkUser.rows.length > 0) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const userRole = role || 'member';

    const result = await query(
      'INSERT INTO users (id_number, email, password, first_name, middle_name, last_name, role, status, course, year) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, id_number, email, first_name, middle_name, last_name, role, course, year',
      [id_number || null, email, hashedPassword, first_name, middle_name || null, last_name, userRole, 'active', req.body.course || null, req.body.year || null]
    );

    const newUser = result.rows[0];

    const payload: AuthPayload = {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    };

    const token = jwt.sign(payload, config.jwt.secret as string, {
      expiresIn: config.jwt.expiresIn,
    } as any);

    res.status(201).json({
      message: 'User registered successfully',
      token,
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
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Registration failed' });
  }
});

export default router;
