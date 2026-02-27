import { useNavigate } from 'react-router-dom';
import '../styles/components.css';

interface HeaderProps {
    title: string;
    isConnected: boolean;
    studentCount?: number;
    showBack?: boolean;
    onLogout?: () => void;
}

const Header = ({ title, isConnected, studentCount, showBack, onLogout }: HeaderProps) => {
    const navigate = useNavigate();

    return (
        <header className="header">
            <div className="header__left">
                {showBack && (
                    <button className="header__back" onClick={() => navigate('/')} title="Back to home">
                        ←
                    </button>
                )}
                <h1 className="header__title">{title}</h1>
            </div>

            <div className="header__right">
                {studentCount !== undefined && (
                    <span className="header__student-count">
                        👥 {studentCount} student{studentCount !== 1 ? 's' : ''}
                    </span>
                )}
                <span className={`header__status header__status--${isConnected ? 'connected' : 'disconnected'}`}>
                    {isConnected ? '● Connected' : '○ Disconnected'}
                </span>
                {onLogout && (
                    <button className="header__logout" onClick={onLogout} title="Sign out">
                        Sign Out
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
