import { useNavigate } from 'react-router-dom';
import '../styles/components.css';

const HomePage = () => {
    const navigate = useNavigate();

    return (
        <div className="home">
            <div className="home__logo">📊</div>
            <h1 className="home__title">Live Polling System</h1>
            <p className="home__subtitle">Real-time polls with instant results</p>

            <div className="home__cards">
                <div className="home__card" onClick={() => navigate('/teacher')}>
                    <div className="home__card-icon">👩‍🏫</div>
                    <div className="home__card-title">I'm a Teacher</div>
                    <div className="home__card-desc">Create polls and view live results</div>
                </div>

                <div className="home__card" onClick={() => navigate('/student')}>
                    <div className="home__card-icon">🎓</div>
                    <div className="home__card-title">I'm a Student</div>
                    <div className="home__card-desc">Answer questions in real-time</div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
