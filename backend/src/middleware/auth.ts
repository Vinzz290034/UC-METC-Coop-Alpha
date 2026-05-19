import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import { query } from '../config/database.js';
import { AuthPayload } from '../types/index.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

// Simple in-memory cache for user status (production should use Redis)
interface UserStatusCache {
  status: string;
  timestamp: number;
}

const userStatusCache = new Map<string, UserStatusCache>();
const CACHE_TTL = 60000; // 1 minute cache

// Helper to check if cache is valid
const isCacheValid = (cached: UserStatusCache | undefined): boolean => {
  if (!cached) return false;
  return Date.now() - cached.timestamp < CACHE_TTL;
};

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    console.log('[AUTH DEBUG] Token verification attempt:', {
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 20) + '...',
      secretLength: config.jwt.secret.length,
      secretPrefix: config.jwt.secret.substring(0, 20) + '...',
      secretValue: config.jwt.secret,
      method: req.method,
      path: req.path,
      timestamp: new Date().toISOString()
    });

    const decoded = jwt.verify(token, config.jwt.secret as string) as AuthPayload;
    
    // Check cache first
    const cachedStatus = userStatusCache.get(decoded.id);
    
    if (isCacheValid(cachedStatus)) {
      // Use cached status
      if (cachedStatus!.status !== 'active') {
        console.log('[AUTH ERROR] User account is inactive (cached):', {
          userId: decoded.id,
          email: decoded.email,
          status: cachedStatus!.status
        });
        return res.status(403).json({ 
          message: 'Your account has been deactivated. Please contact an administrator for assistance.',
          accountStatus: cachedStatus!.status
        });
      }
      
      console.log('[AUTH SUCCESS] Token verified (cached status):', {
        userId: decoded.id,
        userEmail: decoded.email,
        userRole: decoded.role
      });
      
      req.user = decoded;
      return next();
    }
    
    // Cache miss or expired - check database
    const userResult = await query(
      'SELECT id, email, role, status FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      console.log('[AUTH ERROR] User not found in database:', decoded.id);
      userStatusCache.delete(decoded.id); // Clear cache
      return res.status(401).json({ message: 'User account not found' });
    }

    const user = userResult.rows[0];
    
    // Update cache
    userStatusCache.set(decoded.id, {
      status: user.status,
      timestamp: Date.now()
    });

    if (user.status !== 'active') {
      console.log('[AUTH ERROR] User account is inactive:', {
        userId: user.id,
        email: user.email,
        status: user.status
      });
      return res.status(403).json({ 
        message: 'Your account has been deactivated. Please contact an administrator for assistance.',
        accountStatus: user.status
      });
    }
    
    console.log('[AUTH SUCCESS] Token verified for user:', {
      userId: decoded.id,
      userEmail: decoded.email,
      userRole: decoded.role,
      accountStatus: user.status
    });
    
    req.user = decoded;
    next();
  } catch (err: any) {
    console.error('[AUTH ERROR] Token verification failed:', {
      errorName: err.name,
      errorMessage: err.message,
      errorCode: (err as any).code,
      secretLength: config.jwt.secret.length,
      secretValue: config.jwt.secret,
      timestamp: new Date().toISOString()
    });
    
    // Return more detailed error message for debugging
    const errorDetail = err.name === 'TokenExpiredError' 
      ? 'Token has expired'
      : err.name === 'JsonWebTokenError'
      ? 'Invalid token'
      : 'Token verification failed';
    
    res.status(401).json({ 
      message: 'Invalid or expired token',
      detail: errorDetail,
      errorName: err.name,
      secret: config.jwt.secret.substring(0, 20)
    });
  }
};

// Helper function to invalidate user cache (call when user is deactivated/reactivated)
export const invalidateUserCache = (userId: string) => {
  userStatusCache.delete(userId);
  console.log('[AUTH CACHE] Invalidated cache for user:', userId);
};

export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};
