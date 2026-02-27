import type { PollHistoryItem } from '../types';
import ResultsBar from './ResultsBar';
import '../styles/components.css';

interface PollHistoryProps {
    polls: PollHistoryItem[];
}

const PollHistory = ({ polls }: PollHistoryProps) => {
    if (polls.length === 0) {
        return null;
    }

    return (
        <div className="poll-history">
            <h3 className="poll-history__title">📋 Poll History</h3>
            {polls.map((poll) => (
                <div key={poll._id} className="poll-history__item">
                    <div className="poll-history__question">{poll.question}</div>
                    <ResultsBar
                        options={poll.options}
                        voteCounts={poll.voteCounts}
                        totalVotes={poll.totalVotes}
                    />
                    <div className="poll-history__meta">
                        <span>{poll.totalVotes} total vote{poll.totalVotes !== 1 ? 's' : ''}</span>
                        <span>{new Date(poll.createdAt).toLocaleString()}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PollHistory;
