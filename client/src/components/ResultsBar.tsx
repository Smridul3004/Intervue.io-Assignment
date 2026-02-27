import type { PollOption, VoteCounts } from '../types';
import '../styles/components.css';

const OPTION_COLORS = ['var(--option-0)', 'var(--option-1)', 'var(--option-2)', 'var(--option-3)', 'var(--option-4)', 'var(--option-5)'];

interface ResultsBarProps {
    options: PollOption[];
    voteCounts: VoteCounts;
    totalVotes: number;
}

const ResultsBar = ({ options, voteCounts, totalVotes }: ResultsBarProps) => {
    if (!options || options.length === 0) return null;

    return (
        <div className="results-bar">
            {options.map((option, i) => {
                const votes = voteCounts[option.id] || 0;
                const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                const color = OPTION_COLORS[i % OPTION_COLORS.length];

                return (
                    <div key={option.id} className="results-bar__item">
                        <div className="results-bar__header">
                            <span className="results-bar__label">
                                <span className="results-bar__index" style={{ backgroundColor: color }}>
                                    {String.fromCharCode(65 + i)}
                                </span>
                                {option.text}
                            </span>
                            <span className="results-bar__count">
                                {votes} vote{votes !== 1 ? 's' : ''}
                            </span>
                        </div>
                        <div className="results-bar__track">
                            <div
                                className="results-bar__fill"
                                style={{
                                    width: `${Math.max(percentage, percentage > 0 ? 8 : 0)}%`,
                                    backgroundColor: color,
                                }}
                            >
                                {percentage > 0 && (
                                    <span className="results-bar__percentage">{percentage}%</span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ResultsBar;
