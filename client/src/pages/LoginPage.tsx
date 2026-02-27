import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import '../styles/components.css';

const LoginPage = () => {
    const navigate = useNavigate();
    const { login, isLoading } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            await login(email.trim(), password);
            toast.success('Logged in successfully!');
            navigate('/');
        } catch (error: any) {
            toast.error(error.message || 'Login failed');
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-card__logo">📊</div>
                <h1 className="auth-card__title">Welcome Back</h1>
                <p className="auth-card__subtitle">Sign in to the Live Polling System</p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-form__field">
                        <label className="auth-form__label" htmlFor="email">Email</label>
                        <input
                            id="email"
                            className="auth-form__input"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="auth-form__field">
                        <label className="auth-form__label" htmlFor="password">Password</label>
                        <input
                            id="password"
                            className="auth-form__input"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    <button
                        className="auth-form__submit"
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="auth-card__footer">
                    Don't have an account? <Link to="/register" className="auth-card__link">Register</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
