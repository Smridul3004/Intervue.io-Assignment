import { Request, Response } from 'express';
import mongoose from 'mongoose';
import authService from '../services/authService';
import catchAsync from '../utils/catchAsync';

const isDbReady = () => mongoose.connection.readyState === 1;

class AuthController {
    /**
     * POST /api/auth/register
     * Register a new user (teacher or student).
     */
    register = catchAsync(async (req: Request, res: Response) => {
        if (!isDbReady()) {
            res.status(503).json({ success: false, message: 'Database not connected' });
            return;
        }

        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            res.status(400).json({
                success: false,
                message: 'Name, email, password, and role are required',
            });
            return;
        }

        if (!['teacher', 'student'].includes(role)) {
            res.status(400).json({
                success: false,
                message: 'Role must be "teacher" or "student"',
            });
            return;
        }

        const { user, token } = await authService.register({ name, email, password, role });

        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: (user._id as any).toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
                token,
            },
        });
    });

    /**
     * POST /api/auth/login
     * Login an existing user.
     */
    login = catchAsync(async (req: Request, res: Response) => {
        if (!isDbReady()) {
            res.status(503).json({ success: false, message: 'Database not connected' });
            return;
        }

        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: 'Email and password are required',
            });
            return;
        }

        const { user, token } = await authService.login({ email, password });

        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: (user._id as any).toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
                token,
            },
        });
    });

    /**
     * GET /api/auth/me
     * Get the currently authenticated user's profile.
     */
    getMe = catchAsync(async (req: Request, res: Response) => {
        if (!isDbReady()) {
            res.status(503).json({ success: false, message: 'Database not connected' });
            return;
        }

        // req.user is set by the auth middleware
        const user = (req as any).user;

        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            },
        });
    });
}

export default new AuthController();
