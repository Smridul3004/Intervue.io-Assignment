import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { AuthUser } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'polling-auth-token';
const USER_KEY = 'polling-auth-user';

interface AuthContextType {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string, role: 'teacher' | 'student') => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(() => {
        const stored = localStorage.getItem(USER_KEY);
        if (stored) {
            try { return JSON.parse(stored); } catch { return null; }
        }
        return null;
    });

    const [token, setToken] = useState<string | null>(() => {
        return localStorage.getItem(TOKEN_KEY);
    });

    const [isLoading, setIsLoading] = useState(false);

    const isAuthenticated = !!user && !!token;

    // Persist auth state
    useEffect(() => {
        if (token && user) {
            localStorage.setItem(TOKEN_KEY, token);
            localStorage.setItem(USER_KEY, JSON.stringify(user));
        }
    }, [token, user]);

    // Validate token on mount
    useEffect(() => {
        if (!token) return;
        setIsLoading(true);
        fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => {
                if (!res.ok) throw new Error('Invalid token');
                return res.json();
            })
            .then(json => {
                setUser(json.data.user);
            })
            .catch(() => {
                // Token is invalid — clear everything
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(USER_KEY);
                setToken(null);
                setUser(null);
            })
            .finally(() => setIsLoading(false));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const login = useCallback(async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || 'Login failed');

            setUser(json.data.user);
            setToken(json.data.token);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const register = useCallback(async (
        name: string,
        email: string,
        password: string,
        role: 'teacher' | 'student'
    ) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || 'Registration failed');

            setUser(json.data.user);
            setToken(json.data.token);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem('polling-student-session');
        setToken(null);
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
