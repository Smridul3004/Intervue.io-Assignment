import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import useSocket from '../hooks/useSocket';
import usePollTimer from '../hooks/usePollTimer';
import Header from '../components/Header';
import Timer from '../components/Timer';
import PollCreationForm from '../components/PollCreationForm';
import ResultsBar from '../components/ResultsBar';
import PollHistory from '../components/PollHistory';
import type {
    PollData,
    VoteCounts,
    PollStatePayload,
    PollNewPayload,
    PollEndedPayload,
    ResultsUpdatePayload,
    PollHistoryItem,
} from '../types';
import '../styles/components.css';

type ViewState = 'idle' | 'active' | 'ended';

const TeacherPage = () => {
    const { user, token, logout } = useAuth();
    const { socket, isConnected } = useSocket(token);

    const [view, setView] = useState<ViewState>('idle');
    const [poll, setPoll] = useState<PollData | null>(null);
    const [voteCounts, setVoteCounts] = useState<VoteCounts>({});
    const [totalVotes, setTotalVotes] = useState(0);
    const [studentCount, setStudentCount] = useState(0);
    const [pollHistory, setPollHistory] = useState<PollHistoryItem[]>([]);

    const { timeLeft, totalTime, startTimer, stopTimer } = usePollTimer();

    // Fetch poll history via REST
    const fetchHistory = useCallback(async () => {
        try {
            const res = await fetch('http://localhost:5000/api/polls/history');
            const json = await res.json();
            if (json.success) {
                setPollHistory(json.data);
            }
        } catch {
            // Silent fail - history is not critical
        }
    }, []);

    // Socket event handling
    useEffect(() => {
        if (!socket) return;

        // Join as teacher
        socket.emit('teacher:join');

        // Initial state
        const handleState = (data: PollStatePayload) => {
            setStudentCount(data.studentCount);
            if (data.poll && data.poll.status === 'active') {
                setPoll(data.poll);
                setVoteCounts(data.voteCounts);
                setTotalVotes(data.totalVotes);
                setView('active');
                if (data.remainingTime > 0) {
                    startTimer(data.remainingTime);
                }
            } else {
                setView('idle');
            }
        };

        // New poll created
        const handleNew = (data: PollNewPayload) => {
            setPoll(data.poll);
            setVoteCounts({});
            setTotalVotes(0);
            setView('active');
            startTimer(data.remainingTime);
            toast.success('Poll is live! 🚀');
        };

        // Live results update
        const handleResults = (data: ResultsUpdatePayload) => {
            setVoteCounts(data.voteCounts);
            setTotalVotes(data.totalVotes);
        };

        // Poll ended
        const handleEnded = (data: PollEndedPayload) => {
            setVoteCounts(data.finalResults);
            setTotalVotes(data.totalVotes);
            setView('ended');
            stopTimer();
            toast('Poll ended! ⏰', { icon: '📊' });
            fetchHistory();
        };

        // Student count
        const handleStudentCount = (data: { count: number }) => {
            setStudentCount(data.count);
        };

        // Error
        const handleError = (data: { message: string }) => {
            toast.error(data.message);
        };

        socket.on('poll:state', handleState);
        socket.on('poll:new', handleNew);
        socket.on('poll:results-update', handleResults);
        socket.on('poll:ended', handleEnded);
        socket.on('student:count', handleStudentCount);
        socket.on('error', handleError);

        return () => {
            socket.off('poll:state', handleState);
            socket.off('poll:new', handleNew);
            socket.off('poll:results-update', handleResults);
            socket.off('poll:ended', handleEnded);
            socket.off('student:count', handleStudentCount);
            socket.off('error', handleError);
        };
    }, [socket, startTimer, stopTimer, fetchHistory]);

    // Fetch history on mount
    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // Create poll handler
    const handleCreatePoll = useCallback(
        (data: { question: string; options: string[]; timeLimit: number }) => {
            if (!socket) return;
            socket.emit('poll:create', data);
        },
        [socket]
    );

    // Go back to idle after ended poll
    const handleNewPoll = () => {
        setPoll(null);
        setVoteCounts({});
        setTotalVotes(0);
        setView('idle');
    };

    return (
        <div className="page">
            <Header
                title={`Teacher: ${user?.name || 'Dashboard'}`}
                isConnected={isConnected}
                studentCount={studentCount}
                showBack
                onLogout={logout}
            />
            <div className="page__content">
                {/* Idle: show creation form */}
                {view === 'idle' && (
                    <PollCreationForm onSubmit={handleCreatePoll} isDisabled={!isConnected} />
                )}

                {/* Active or Ended: show live results */}
                {(view === 'active' || view === 'ended') && poll && (
                    <div className="active-poll">
                        <div className="active-poll__header">
                            <h2 className="active-poll__question">{poll.question}</h2>
                            <div className="active-poll__header-right">
                                {view === 'active' && (
                                    <Timer timeLeft={timeLeft} totalTime={totalTime} />
                                )}
                                <span
                                    className={`active-poll__status active-poll__status--${view === 'active' ? 'active' : 'ended'
                                        }`}
                                >
                                    {view === 'active' ? '● Live' : '● Ended'}
                                </span>
                            </div>
                        </div>

                        <ResultsBar
                            options={poll.options}
                            voteCounts={voteCounts}
                            totalVotes={totalVotes}
                        />

                        <div className="active-poll__total">
                            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} received
                        </div>

                        {view === 'ended' && (
                            <button
                                className="poll-form__submit"
                                onClick={handleNewPoll}
                                style={{ marginTop: '1.5rem' }}
                            >
                                Ask Another Question
                            </button>
                        )}
                    </div>
                )}

                {/* Poll history */}
                <PollHistory polls={pollHistory} />
            </div>
        </div>
    );
};

export default TeacherPage;
