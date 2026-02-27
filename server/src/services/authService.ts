import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { AppError } from '../utils/AppError';

const JWT_SECRET = process.env.JWT_SECRET || 'live-polling-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

interface AuthPayload {
    id: string;
    email: string;
    role: 'teacher' | 'student';
    name: string;
}

class AuthService {
    /**
     * Generate a JWT token for a user.
     */
    generateToken(user: IUser): string {
        const payload: AuthPayload = {
            id: (user._id as any).toString(),
            email: user.email,
            role: user.role,
            name: user.name,
        };
        return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    }

    /**
     * Verify and decode a JWT token.
     */
    verifyToken(token: string): AuthPayload {
        try {
            return jwt.verify(token, JWT_SECRET) as AuthPayload;
        } catch {
            throw new AppError('Invalid or expired token', 401);
        }
    }

    /**
     * Register a new user.
     */
    async register(data: {
        name: string;
        email: string;
        password: string;
        role: 'teacher' | 'student';
    }): Promise<{ user: IUser; token: string }> {
        const { name, email, password, role } = data;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new AppError('An account with this email already exists', 409);
        }

        const user = await User.create({ name, email, password, role });

        // Remove password from the returned user object
        user.password = undefined as any;

        const token = this.generateToken(user);
        return { user, token };
    }

    /**
     * Login an existing user.
     */
    async login(data: {
        email: string;
        password: string;
    }): Promise<{ user: IUser; token: string }> {
        const { email, password } = data;

        // Find user and include password for comparison
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            throw new AppError('Invalid email or password', 401);
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new AppError('Invalid email or password', 401);
        }

        // Remove password from the returned user object
        user.password = undefined as any;

        const token = this.generateToken(user);
        return { user, token };
    }

    /**
     * Get user by ID (without password).
     */
    async getUserById(userId: string): Promise<IUser | null> {
        return User.findById(userId);
    }
}

export default new AuthService();
