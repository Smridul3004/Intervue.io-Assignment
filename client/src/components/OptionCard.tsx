import type { PollOption, VoteCounts } from '../types';
import '../styles/components.css';

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
    const votes = voteCounts[option.id] || 0;
    const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
    const maxVotes = Math.max(...Object.values(voteCounts), 1);
    const fillPct = votes > 0 ? (votes / maxVotes) * 100 : 0;

    // Results mode (voted / ended): fill-bar style matching teacher live results
    if (showResults) {
        return (
            <div className={`s-result-option ${isSelected ? 's-result-option--selected' : ''}`}>
                <div className="s-result-option__fill" style={{ width: `${fillPct}%` }} />
                <span className="s-result-option__index">{index + 1}</span>
                <span className="s-result-option__text">{option.text}</span>
                <span className="s-result-option__pct">{percentage}%</span>
            </div>
        );
    }

    // Voting mode: select / unselect style
    return (
        <div
            className={`s-vote-option ${isSelected ? 's-vote-option--selected' : ''} ${isDisabled ? 's-vote-option--disabled' : ''}`}
            onClick={isDisabled ? undefined : onClick}
            role="button"
            tabIndex={0}
        >
            <span className="s-vote-option__index">{index + 1}</span>
            <span className="s-vote-option__text">{option.text}</span>
        </div>
    );
};

export default OptionCard;
