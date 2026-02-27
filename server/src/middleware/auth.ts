import { Request, Response, NextFunction } from 'express';
import authService from '../services/authService';

/**
 * Middleware that verifies JWT token from the Authorization header.
 * Sets req.user with the decoded token payload.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = authService.verifyToken(token);
        (req as any).user = decoded;
        next();
    } catch {
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

/**
 * Middleware that restricts access to specific roles.
 * Must be used after `authenticate`.
 */
export const authorize = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const user = (req as any).user;
        if (!user || !roles.includes(user.role)) {
            res.status(403).json({ success: false, message: 'Insufficient permissions' });
            return;
        }
        next();
    };
};
