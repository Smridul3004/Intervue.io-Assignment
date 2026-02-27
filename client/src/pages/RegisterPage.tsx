import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import '../styles/components.css';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { register, isLoading } = useAuth();
    const [searchParams] = useSearchParams();

    // Role comes from the HomePage role-card selection (?role=student|teacher)
    const roleParam = searchParams.get('role');
    const role: 'teacher' | 'student' =
        roleParam === 'teacher' ? 'teacher' : 'student';

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

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
            navigate(role === 'teacher' ? '/teacher' : '/student');
        } catch (error: any) {
            toast.error(error.message || 'Registration failed');
        }
    };

    const isStudent = role === 'student';

    return (
        <div className="auth-page">
            {/* Badge */}
            <div className="auth-badge">
                <svg className="auth-badge__icon" width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.5 1.5C3.5 0.671573 4.17157 0 5 0H10C10.8284 0 11.5 0.671573 11.5 1.5V13.5C11.5 14.3284 10.8284 15 10 15H5C4.17157 15 3.5 14.3284 3.5 13.5V1.5Z" fill="white" />
                    <path d="M0 5.5C0 4.67157 0.671573 4 1.5 4H4V13.5C4 14.3284 3.32843 15 2.5 15H1.5C0.671573 15 0 14.3284 0 13.5V5.5Z" fill="white" opacity="0.7" />
                    <path d="M11 8.5C11 7.67157 11.6716 7 12.5 7H13.5C14.3284 7 15 7.67157 15 8.5V13.5C15 14.3284 14.3284 15 13.5 15H12.5C11.6716 15 11 14.3284 11 13.5V8.5Z" fill="white" opacity="0.5" />
                </svg>
                <span className="auth-badge__text">Intervue Poll</span>
            </div>

            {/* Header */}
            <div className="auth-header">
                <h1 className="auth-header__title">Let's Get Started</h1>
            </div>

            {/* Description */}
            <p className="auth-description">
                {isStudent ? (
                    <>If you're a <strong>student</strong>, you'll be able to <strong>submit your answers</strong>, participate in <strong>live polls</strong>, and see how your responses compare with your classmates</>
                ) : (
                    <>If you're a <strong>teacher</strong>, you'll be able to <strong>create polls</strong>, <strong>manage questions</strong>, and <strong>view live results</strong> from your students</>
                )}
            </p>

            {/* Form */}
            <form className="auth-form" onSubmit={handleSubmit}>
                <div className="auth-form__field">
                    <label className="auth-form__label" htmlFor="name">Enter your Name</label>
                    <input
                        id="name"
                        className="auth-form__input"
                        type="text"
                        placeholder="Rahul Bajaj"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        autoComplete="name"
                        required
                    />
                </div>

                <div className="auth-form__field">
                    <label className="auth-form__label" htmlFor="email">Enter your Email</label>
                    <input
                        id="email"
                        className="auth-form__input"
                        type="email"
                        placeholder="rahul@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                    />
                </div>

                <div className="auth-form__field">
                    <label className="auth-form__label" htmlFor="password">Enter your Password</label>
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

                <button
                    className="auth-form__submit"
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? 'Creating...' : 'Continue'}
                </button>
            </form>

            {/* Footer */}
            <p className="auth-footer">
                Already have an account? <Link to="/login" className="auth-footer__link">Sign in</Link>
            </p>
            <p className="auth-footer">
                <Link to="/" className="auth-footer__link">← Back to role selection</Link>
            </p>
        </div>
    );
};

export default RegisterPage;
