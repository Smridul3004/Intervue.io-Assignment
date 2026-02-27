import '../styles/components.css';

interface TimerProps {
    timeLeft: number;
    totalTime: number;
}

const RADIUS = 30;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const Timer = ({ timeLeft, totalTime }: TimerProps) => {
    const progress = totalTime > 0 ? timeLeft / totalTime : 0;
    const offset = CIRCUMFERENCE * (1 - progress);
    const isUrgent = timeLeft <= 10;
    const color = isUrgent ? 'var(--error)' : timeLeft <= 30 ? 'var(--warning)' : 'var(--primary)';

    return (
        <div className="timer">
            <div className="timer__circle">
                <svg className="timer__svg" viewBox="0 0 72 72">
                    <circle className="timer__bg" cx="36" cy="36" r={RADIUS} />
                    <circle
                        className="timer__progress"
                        cx="36"
                        cy="36"
                        r={RADIUS}
                        stroke={color}
                        strokeDasharray={CIRCUMFERENCE}
                        strokeDashoffset={offset}
                    />
                </svg>
                <span className={`timer__text ${isUrgent ? 'pulse' : ''}`} style={{ color }}>
                    {timeLeft}
                </span>
            </div>
            <span className="timer__label">seconds left</span>
        </div>
    );
};

export default Timer;
