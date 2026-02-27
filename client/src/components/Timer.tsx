import '../styles/components.css';

interface TimerProps {
    timeLeft: number;
    totalTime: number;
}

const Timer = ({ timeLeft }: TimerProps) => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    return (
        <div className="timer">
            <svg className="timer__icon" width="16" height="19" viewBox="0 0 16 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 1C4.134 1 1 4.134 1 8C1 11.866 4.134 15 8 15C11.866 15 15 11.866 15 8C15 4.134 11.866 1 8 1ZM8 13.4C5.018 13.4 2.6 10.982 2.6 8C2.6 5.018 5.018 2.6 8 2.6C10.982 2.6 13.4 5.018 13.4 8C13.4 10.982 10.982 13.4 8 13.4ZM7.2 4.2V8.664L10.768 12.232L11.899 11.101L8.8 8.002V4.2H7.2Z" fill="black" />
            </svg>
            <span className="timer__text">{formatted}</span>
        </div>
    );
};

export default Timer;
