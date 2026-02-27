import type { PollOption, VoteCounts } from '../types';
import '../styles/components.css';

const OPTION_COLORS = ['var(--option-0)', 'var(--option-1)', 'var(--option-2)', 'var(--option-3)', 'var(--option-4)', 'var(--option-5)'];

interface OptionCardProps {
    option: PollOption;
    index: number;
    isSelected: boolean;
    isDisabled: boolean;
    showResults: boolean;
    voteCounts: VoteCounts;
    totalVotes: number;
    onClick: () => void;
}

const OptionCard = ({
    option,
    index,
    isSelected,
    isDisabled,
    showResults,
    voteCounts,
    totalVotes,
    onClick,
}: OptionCardProps) => {
    const color = OPTION_COLORS[index % OPTION_COLORS.length];
    const votes = voteCounts[option.id] || 0;
    const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;

    const classNames = [
        'option-card',
        isSelected && 'option-card--selected',
        isDisabled && 'option-card--disabled',
    ].filter(Boolean).join(' ');

    return (
        <div className={classNames} onClick={isDisabled ? undefined : onClick} role="button" tabIndex={0}>
            {/* Background bar for results */}
            {showResults && (
                <div
                    className="option-card__bar"
                    style={{ width: `${percentage}%`, backgroundColor: color }}
                />
            )}

            {/* Option letter badge */}
            <div className="option-card__index" style={{ backgroundColor: color }}>
                {String.fromCharCode(65 + index)}
            </div>

            {/* Option text */}
            <span className="option-card__text">{option.text}</span>

            {/* Vote count when showing results */}
            {showResults && (
                <span className="option-card__votes">
                    {votes} ({percentage}%)
                </span>
            )}
        </div>
    );
};

export default OptionCard;
