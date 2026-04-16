import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import { AuthPayload } from '../types/index.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
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
    
    console.log('[AUTH SUCCESS] Token verified for user:', {
      userId: decoded.id,
      userEmail: decoded.email,
      userRole: decoded.role
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
