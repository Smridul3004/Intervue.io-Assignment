import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/components.css';

type Role = 'student' | 'teacher';

const HomePage = () => {
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);

    const handleContinue = () => {
        if (selectedRole) {
            navigate(`/register?role=${selectedRole}`);
        }
    };

    return (
        <div className="home">
            {/* Top Badge */}
            <div className="home__badge">
                <svg className="home__badge-icon" width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.5 1.5C3.5 0.671573 4.17157 0 5 0H10C10.8284 0 11.5 0.671573 11.5 1.5V13.5C11.5 14.3284 10.8284 15 10 15H5C4.17157 15 3.5 14.3284 3.5 13.5V1.5Z" fill="white" />
                    <path d="M0 5.5C0 4.67157 0.671573 4 1.5 4H4V13.5C4 14.3284 3.32843 15 2.5 15H1.5C0.671573 15 0 14.3284 0 13.5V5.5Z" fill="white" opacity="0.7" />
                    <path d="M11 8.5C11 7.67157 11.6716 7 12.5 7H13.5C14.3284 7 15 7.67157 15 8.5V13.5C15 14.3284 14.3284 15 13.5 15H12.5C11.6716 15 11 14.3284 11 13.5V8.5Z" fill="white" opacity="0.5" />
                </svg>
                <span className="home__badge-text">Intervue Poll</span>
            </div>

            {/* Header Section */}
            <div className="home__header">
                <h1 className="home__title">Welcome to the <strong>Live Polling System</strong></h1>
                <p className="home__subtitle">
                    Please <strong>select the role</strong> that best describes you to begin using the live polling system
                </p>
            </div>

            {/* Role Selection Cards */}
            <div className="home__cards">
                <div
                    className={`home__card ${selectedRole === 'student' ? 'home__card--selected' : ''}`}
                    onClick={() => setSelectedRole('student')}
                >
                    <div className="home__card-body">
                        <div className="home__card-title">I'm a <strong>Student</strong></div>
                        <div className="home__card-desc">
                            Submit answers and view <strong>live poll results</strong> in real-time.
                        </div>
                    </div>
                </div>

                <div
                    className={`home__card ${selectedRole === 'teacher' ? 'home__card--selected' : ''}`}
                    onClick={() => setSelectedRole('teacher')}
                >
                    <div className="home__card-body">
                        <div className="home__card-title">I'm a <strong>Teacher</strong></div>
                        <div className="home__card-desc">
                            <strong>Create polls</strong>, manage questions and view live results.
                        </div>
                    </div>
                </div>
            </div>

            {/* Continue Button */}
            <button
                className="home__continue"
                onClick={handleContinue}
                disabled={!selectedRole}
            >
                Continue
            </button>

            {/* Already a member link */}
            <p className="home__footer">
                Already a member?{' '}
                <Link to="/login" className="home__footer-link">Sign in</Link>
            </p>
        </div>
    );
};

export default HomePage;
