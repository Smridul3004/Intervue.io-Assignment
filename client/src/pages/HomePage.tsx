import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/components.css';

const HomePage = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    // Auto-navigate based on role
    const handleEnter = () => {
        if (user?.role === 'teacher') {
            navigate('/teacher');
        } else if (user?.role === 'student') {
            navigate('/student');
        }
    };

    return (
        <div className="home">
            <div className="home__logo">📊</div>
            <h1 className="home__title">Live Polling System</h1>
            <p className="home__subtitle">Real-time polls with instant results</p>

            {user && (
                <div className="home__user-info">
                    <p className="home__welcome">
                        Welcome, <strong>{user.name}</strong>!
                    </p>
                    <p className="home__role-badge">
                        {user.role === 'teacher' ? '👩‍🏫' : '🎓'} Signed in as <strong>{user.role}</strong>
                    </p>
                </div>
            )}

            <div className="home__cards">
                <div className="home__card" onClick={handleEnter}>
                    <div className="home__card-icon">{user?.role === 'teacher' ? '👩‍🏫' : '🎓'}</div>
                    <div className="home__card-title">
                        Enter {user?.role === 'teacher' ? 'Teacher' : 'Student'} Dashboard
                    </div>
                    <div className="home__card-desc">
                        {user?.role === 'teacher'
                            ? 'Create polls and view live results'
                            : 'Answer questions in real-time'}
                    </div>
                </div>
            </div>

            <button className="home__logout" onClick={logout}>
                Sign Out
            </button>
        </div>
    );
};

export default HomePage;
