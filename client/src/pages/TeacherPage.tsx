import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import useSocket from '../hooks/useSocket';
import usePollTimer from '../hooks/usePollTimer';
import Timer from '../components/Timer';
import PollCreationForm from '../components/PollCreationForm';
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
type Section = 'poll' | 'history';

interface Participant {
    odescription: string;  // socketId
    userId: string;
    name: string;
    hasVoted: boolean;
}

const TeacherPage = () => {
    const { user, token, logout } = useAuth();
    const { socket, isConnected } = useSocket(token);

    const [view, setView] = useState<ViewState>('idle');
    const [poll, setPoll] = useState<PollData | null>(null);
    const [voteCounts, setVoteCounts] = useState<VoteCounts>({});
    const [totalVotes, setTotalVotes] = useState(0);
    const [studentCount, setStudentCount] = useState(0);
    const [pollHistory, setPollHistory] = useState<PollHistoryItem[]>([]);
    const [section, setSection] = useState<Section>('poll');

    // Popup panel state
    const [showPopup, setShowPopup] = useState(false);
    const [popupTab, setPopupTab] = useState<'chat' | 'participants'>('participants');
    const [participants, setParticipants] = useState<Participant[]>([]);

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

        // Participants list response
        const handleParticipants = (data: { participants: Participant[] }) => {
            setParticipants(data.participants);
        };

        // Kick success
        const handleKickSuccess = (data: { userId: string; name: string }) => {
            toast.success(`${data.name} has been removed`);
            setParticipants(prev => prev.filter(p => p.userId !== data.userId));
        };

        socket.on('poll:state', handleState);
        socket.on('poll:new', handleNew);
        socket.on('poll:results-update', handleResults);
        socket.on('poll:ended', handleEnded);
        socket.on('student:count', handleStudentCount);
        socket.on('teacher:participants', handleParticipants);
        socket.on('teacher:kick-success', handleKickSuccess);
        socket.on('error', handleError);

        return () => {
            socket.off('poll:state', handleState);
            socket.off('poll:new', handleNew);
            socket.off('poll:results-update', handleResults);
            socket.off('poll:ended', handleEnded);
            socket.off('student:count', handleStudentCount);
            socket.off('teacher:participants', handleParticipants);
            socket.off('teacher:kick-success', handleKickSuccess);
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

    // Toggle popup panel and request fresh participants list
    const togglePopup = useCallback(() => {
        setShowPopup(prev => {
            const opening = !prev;
            if (opening && socket && poll) {
                socket.emit('teacher:get-participants', { pollId: poll._id });
            }
            return opening;
        });
    }, [socket, poll]);

    // Kick a student
    const handleKick = useCallback(
        (userId: string) => {
            if (!socket || !poll) return;
            socket.emit('teacher:kick', { userId, pollId: poll._id });
        },
        [socket, poll]
    );

    return (
        <div className="teacher-page">
            {/* Top Badge */}
            <div className="teacher-page__badge">
                <svg className="teacher-page__badge-icon" width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.5 1.5C3.5 0.671573 4.17157 0 5 0H10C10.8284 0 11.5 0.671573 11.5 1.5V13.5C11.5 14.3284 10.8284 15 10 15H5C4.17157 15 3.5 14.3284 3.5 13.5V1.5Z" fill="white" />
                    <path d="M0 5.5C0 4.67157 0.671573 4 1.5 4H4V13.5C4 14.3284 3.32843 15 2.5 15H1.5C0.671573 15 0 14.3284 0 13.5V5.5Z" fill="white" opacity="0.7" />
                    <path d="M11 8.5C11 7.67157 11.6716 7 12.5 7H13.5C14.3284 7 15 7.67157 15 8.5V13.5C15 14.3284 14.3284 15 13.5 15H12.5C11.6716 15 11 14.3284 11 13.5V8.5Z" fill="white" opacity="0.5" />
                </svg>
                <span className="teacher-page__badge-text">Intervue Poll</span>
            </div>

            {/* Header */}
            <div className="teacher-page__header">
                <h1 className="teacher-page__title">Let's Get Started</h1>
                <p className="teacher-page__subtitle">
                    you'll have the ability to <strong>create and manage polls</strong>, ask questions, and <strong>monitor your students' responses</strong> in real-time.
                </p>
            </div>

            {/* Section Tabs */}
            <div className="teacher-page__tabs">
                <button
                    className={`teacher-page__tab ${section === 'poll' ? 'teacher-page__tab--active' : ''}`}
                    onClick={() => setSection('poll')}
                >
                    Live Poll
                </button>
                <button
                    className={`teacher-page__tab ${section === 'history' ? 'teacher-page__tab--active' : ''}`}
                    onClick={() => { setSection('history'); fetchHistory(); }}
                >
                    Poll History
                </button>
            </div>

            {/* Main Content */}
            <div className="teacher-page__content">
                {section === 'poll' && (
                    <>
                        {/* Idle: show creation form */}
                        {view === 'idle' && (
                            <PollCreationForm onSubmit={handleCreatePoll} isDisabled={!isConnected} />
                        )}

                        {/* Active or Ended: Figma-styled results card */}
                        {(view === 'active' || view === 'ended') && poll && (() => {
                            const hasVotes = totalVotes > 0;
                            const maxVotes = Math.max(...poll.options.map(o => voteCounts[o.id] || 0), 1);
                            // When active with no votes yet → show clean option pills (same style as student)
                            // When votes arrive or poll ended → show fill-bar results
                            const showBars = hasVotes || view === 'ended';
                            return (
                                <div className="live-results">
                                    {/* Title row above card */}
                                    <div className="live-results__meta">
                                        <span className="live-results__label">Question</span>
                                        <div className="live-results__right">
                                            {view === 'active' && <Timer timeLeft={timeLeft} totalTime={totalTime} />}
                                            <span className={`live-results__status live-results__status--${view === 'active' ? 'active' : 'ended'}`}>
                                                {view === 'active' ? '● Live' : '● Ended'}
                                            </span>
                                            <button
                                                className="live-results__history-btn"
                                                onClick={() => { setSection('history'); fetchHistory(); }}
                                            >
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M12 4.5C7.305 4.5 3.25 7.611 2 12C3.25 16.389 7.305 19.5 12 19.5C16.695 19.5 20.75 16.389 22 12C20.75 7.611 16.695 4.5 12 4.5ZM12 17C9.239 17 7 14.761 7 12C7 9.239 9.239 7 12 7C14.761 7 17 9.239 17 12C17 14.761 14.761 17 12 17ZM12 9C10.343 9 9 10.343 9 12C9 13.657 10.343 15 12 15C13.657 15 15 13.657 15 12C15 10.343 13.657 9 12 9Z" fill="white" />
                                                </svg>
                                                View Poll history
                                            </button>
                                        </div>
                                    </div>

                                    {/* Card */}
                                    <div className="live-results__card">
                                        {/* Dark gradient header */}
                                        <div className="live-results__card-header">
                                            {poll.question}
                                        </div>

                                        {/* Options body */}
                                        <div className="live-results__card-body">
                                            {poll.options.map((option, i) => {
                                                if (!showBars) {
                                                    // No votes yet — clean pill style matching student view
                                                    return (
                                                        <div key={option.id} className="s-vote-option s-vote-option--disabled">
                                                            <span className="s-vote-option__index">{i + 1}</span>
                                                            <span className="s-vote-option__text">{option.text}</span>
                                                        </div>
                                                    );
                                                }
                                                // Votes in — fill-bar results
                                                const votes = voteCounts[option.id] || 0;
                                                const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                                                const fillPct = (votes / maxVotes) * 100;
                                                const isTop = votes === maxVotes && votes > 0;
                                                return (
                                                    <div
                                                        key={option.id}
                                                        className={`live-results__option ${isTop ? 'live-results__option--top' : ''}`}
                                                    >
                                                        <div className="live-results__fill" style={{ width: `${fillPct}%` }} />
                                                        <span className="live-results__index">{i + 1}</span>
                                                        <span className="live-results__text">{option.text}</span>
                                                        <span className="live-results__pct">{pct}%</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {!showBars && view === 'active' && (
                                        <p className="live-results__waiting-hint">Waiting for students to vote…</p>
                                    )}

                                    {view === 'ended' && (
                                        <button className="live-results__new-btn" onClick={handleNewPoll}>
                                            + Ask a new question
                                        </button>
                                    )}
                                </div>
                            );
                        })()}
                    </>
                )}

                {section === 'history' && (
                    <PollHistory polls={pollHistory} />
                )}
            </div>

            {/* Connection indicator */}
            <div className="teacher-page__connection">
                <span className={`teacher-page__status ${isConnected ? 'teacher-page__status--on' : 'teacher-page__status--off'}`}>
                    {isConnected ? '● Connected' : '● Disconnected'}
                </span>
                <span className="teacher-page__student-count">👥 {studentCount} student{studentCount !== 1 ? 's' : ''}</span>
                <button className="teacher-page__logout" onClick={logout}>Logout</button>
            </div>

            {/* Floating Chat/Participants FAB — only during active/ended poll */}
            {(view === 'active' || view === 'ended') && poll && (
                <>
                    {/* FAB button */}
                    <button className="live-fab" onClick={togglePopup} title="Chat &amp; Participants">
                        <svg width="39" height="39" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19.5 3C10.387 3 3 9.716 3 18C3 21.643 4.386 24.977 6.69 27.578L3.75 35.25L12.312 32.883C14.536 33.927 17.002 34.5 19.626 34.5C28.739 34.5 36 27.784 36 19.5C36 11.216 28.613 3 19.5 3Z" fill="white" />
                        </svg>
                    </button>

                    {/* Popup panel */}
                    {showPopup && (
                        <div className="live-panel">
                            {/* Tab bar */}
                            <div className="live-panel__tabs">
                                <button
                                    className={`live-panel__tab ${popupTab === 'chat' ? 'live-panel__tab--active' : ''}`}
                                    onClick={() => setPopupTab('chat')}
                                >
                                    Chat
                                </button>
                                <button
                                    className={`live-panel__tab ${popupTab === 'participants' ? 'live-panel__tab--active' : ''}`}
                                    onClick={() => {
                                        setPopupTab('participants');
                                        if (socket && poll) socket.emit('teacher:get-participants', { pollId: poll._id });
                                    }}
                                >
                                    Participants
                                </button>
                                <button className="live-panel__close" onClick={() => setShowPopup(false)}>✕</button>
                            </div>

                            {/* Chat — coming soon */}
                            {popupTab === 'chat' && (
                                <div className="live-panel__coming-soon">
                                    <div className="live-panel__coming-soon-icon">💬</div>
                                    <p className="live-panel__coming-soon-title">Chat Coming Soon</p>
                                    <p className="live-panel__coming-soon-sub">Live chat between students and teacher will be available in a future update.</p>
                                </div>
                            )}

                            {/* Participants */}
                            {popupTab === 'participants' && (
                                <div className="live-panel__participants">
                                    <div className="live-panel__participants-header">
                                        <span>Name</span>
                                        <span>Action</span>
                                    </div>
                                    <div className="live-panel__participants-list">
                                        {participants.length === 0 && (
                                            <p className="live-panel__empty">No students connected</p>
                                        )}
                                        {participants.map(p => (
                                            <div key={p.userId} className="live-panel__participant-row">
                                                <span className="live-panel__participant-name">{p.name}</span>
                                                <button
                                                    className="live-panel__kick"
                                                    onClick={() => handleKick(p.userId)}
                                                >
                                                    Kick out
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default TeacherPage;
