import { Router, Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import { query } from '../config/database.js';
import { User, AuthPayload } from '../types/index.js';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0] as User;

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isValidPassword = await bcryptjs.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
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
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed' });
  }
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, first_name, last_name, role } = req.body;

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
      'INSERT INTO users (email, password, first_name, last_name, role, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, role',
      [email, hashedPassword, first_name, last_name, userRole, 'active']
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
      user: newUser,
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Registration failed' });
  }
});

export default router;
