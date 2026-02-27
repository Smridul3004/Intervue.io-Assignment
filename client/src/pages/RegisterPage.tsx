import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import '../styles/components.css';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { register, isLoading } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'teacher' | 'student'>('student');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim() || !password) {
            toast.error('Please fill in all fields');
            return;
        }
        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        try {
            await register(name.trim(), email.trim(), password, role);
            toast.success('Account created successfully!');
            navigate('/');
        } catch (error: any) {
            toast.error(error.message || 'Registration failed');
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-card__logo">📊</div>
                <h1 className="auth-card__title">Create Account</h1>
                <p className="auth-card__subtitle">Join the Live Polling System</p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-form__field">
                        <label className="auth-form__label" htmlFor="name">Full Name</label>
                        <input
                            id="name"
                            className="auth-form__input"
                            type="text"
                            placeholder="Your name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            autoComplete="name"
                            required
                        />
                    </div>

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
                            placeholder="Min 6 characters"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoComplete="new-password"
                            minLength={6}
                            required
                        />
                    </div>

                    <div className="auth-form__field">
                        <label className="auth-form__label">I am a...</label>
                        <div className="auth-form__role-toggle">
                            <button
                                type="button"
                                className={`auth-form__role-btn ${role === 'teacher' ? 'auth-form__role-btn--active' : ''}`}
                                onClick={() => setRole('teacher')}
                            >
                                👩‍🏫 Teacher
                            </button>
                            <button
                                type="button"
                                className={`auth-form__role-btn ${role === 'student' ? 'auth-form__role-btn--active' : ''}`}
                                onClick={() => setRole('student')}
                            >
                                🎓 Student
                            </button>
                        </div>
                    </div>

                    <button
                        className="auth-form__submit"
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <p className="auth-card__footer">
                    Already have an account? <Link to="/login" className="auth-card__link">Sign in</Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
