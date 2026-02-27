import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import useSocket from '../hooks/useSocket';
import useStudentSession from '../hooks/useStudentSession';
import usePollTimer from '../hooks/usePollTimer';
import Header from '../components/Header';
import Timer from '../components/Timer';
import OptionCard from '../components/OptionCard';
import StudentNameModal from '../components/StudentNameModal';
import type {
    PollData,
    VoteCounts,
    PollStatePayload,
    PollNewPayload,
    PollEndedPayload,
    ResultsUpdatePayload,
} from '../types';
import '../styles/components.css';

type ViewState = 'onboarding' | 'waiting' | 'voting' | 'voted' | 'results' | 'kicked';

const StudentPage = () => {
    const { user, token, logout } = useAuth();
    const { socket, isConnected } = useSocket(token);
    const { session, createSession } = useStudentSession();

    // Auto-create session from authenticated user if none exists
    useEffect(() => {
        if (user && !session) {
            createSession(user.name);
        }
    }, [user, session, createSession]);

    const [view, setView] = useState<ViewState>(() => {
        // Restore kicked state across navigation (e.g. home → student page)
        if (sessionStorage.getItem('student_kicked') === 'true') return 'kicked';
        return session || user ? 'waiting' : 'onboarding';
    });
    const [poll, setPoll] = useState<PollData | null>(null);
    const [voteCounts, setVoteCounts] = useState<VoteCounts>({});
    const [totalVotes, setTotalVotes] = useState(0);
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
    const [pendingOptionId, setPendingOptionId] = useState<string | null>(null);
    const [studentCount, setStudentCount] = useState(0);

    const { timeLeft, totalTime, startTimer, stopTimer } = usePollTimer();

    // Join as student when socket + session are ready
    useEffect(() => {
        if (!socket || !session) return;

        // Don't attempt to rejoin if we were kicked — server will reject anyway
        // But still register listeners below so we can hear poll:new / student:kicked
        const isKicked = sessionStorage.getItem('student_kicked') === 'true';
        if (!isKicked) {
            socket.emit('student:join', {
                sessionId: session.sessionId,
                name: session.name,
            });
        }

        // Initial state
        const handleState = (data: PollStatePayload) => {
            setStudentCount(data.studentCount);

            if (data.poll && data.poll.status === 'active') {
                setPoll(data.poll);
                setVoteCounts(data.voteCounts);
                setTotalVotes(data.totalVotes);

                if (data.hasVoted) {
                    setSelectedOptionId(data.selectedOptionId || null);
                    setView('voted');
                } else {
                    setView('voting');
                }

                if (data.remainingTime > 0) {
                    startTimer(data.remainingTime);
                }
            } else {
                setPoll(null);
                setView('waiting');
            }
        };

        // New poll started
        const handleNew = (data: PollNewPayload) => {
            // Clear kicked status — teacher started a new round
            sessionStorage.removeItem('student_kicked');
            setPoll(data.poll);
            setVoteCounts({});
            setTotalVotes(0);
            setSelectedOptionId(null);
            setPendingOptionId(null);
            setView('voting');
            startTimer(data.remainingTime);
            toast('New question! 📝', { icon: '🔔' });
        };

        // Vote accepted
        const handleVoteAccepted = (data: { pollId: string; optionId: string }) => {
            setSelectedOptionId(data.optionId);
            setView('voted');
            toast.success('Vote submitted!');
        };

        // Vote rejected
        const handleVoteRejected = (data: { message: string }) => {
            toast.error(data.message);
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
            setView('results');
            stopTimer();
        };

        // Student count
        const handleStudentCount = (data: { count: number }) => {
            setStudentCount(data.count);
        };

        // Error
        const handleError = (data: { message: string }) => {
            toast.error(data.message);
        };

        // Kicked by teacher
        const handleKicked = () => {
            sessionStorage.setItem('student_kicked', 'true');
            setPoll(null);
            stopTimer();
            setView('kicked');
        };

        socket.on('poll:state', handleState);
        socket.on('poll:new', handleNew);
        socket.on('poll:vote-accepted', handleVoteAccepted);
        socket.on('poll:vote-rejected', handleVoteRejected);
        socket.on('poll:results-update', handleResults);
        socket.on('poll:ended', handleEnded);
        socket.on('student:count', handleStudentCount);
        socket.on('student:kicked', handleKicked);
        socket.on('error', handleError);

        return () => {
            socket.off('poll:state', handleState);
            socket.off('poll:new', handleNew);
            socket.off('poll:vote-accepted', handleVoteAccepted);
            socket.off('poll:vote-rejected', handleVoteRejected);
            socket.off('poll:results-update', handleResults);
            socket.off('poll:ended', handleEnded);
            socket.off('student:count', handleStudentCount);
            socket.off('student:kicked', handleKicked);
            socket.off('error', handleError);
        };
    }, [socket, session, startTimer, stopTimer]);

    // Handle name submission from modal
    const handleNameSubmit = useCallback(
        (name: string) => {
            const newSession = createSession(name);
            setView('waiting');

            // Join immediately with the new session
            if (socket) {
                socket.emit('student:join', {
                    sessionId: newSession.sessionId,
                    name: newSession.name,
                });
            }
        },
        [socket, createSession]
    );

    // Handle option selection (select only, don't submit yet)
    const handleSelectOption = useCallback(
        (optionId: string) => {
            setPendingOptionId(optionId);
        },
        []
    );

    // Handle vote submission (after selecting an option)
    const handleSubmitVote = useCallback(() => {
        if (!socket || !poll || !pendingOptionId) return;
        socket.emit('poll:vote', {
            pollId: poll._id,
            optionId: pendingOptionId,
        });
    }, [socket, poll, pendingOptionId]);

    // Handle returning to waiting room after being kicked
    const handleGoHome = useCallback(() => {
        // Clear the kicked flag and reset to waiting state
        // Student stays on the page and waits for the next poll
        sessionStorage.removeItem('student_kicked');
        setPoll(null);
        setVoteCounts({});
        setTotalVotes(0);
        setSelectedOptionId(null);
        setPendingOptionId(null);
        setView('waiting');
    }, []);

    return (
        <div className="page">
            <Header
                title={`Student: ${user?.name || session?.name || 'View'}`}
                isConnected={isConnected}
                studentCount={studentCount}
                showBack
                onLogout={logout}
            />

            <div className="page__content">
                {/* Onboarding: name modal */}
                {view === 'onboarding' && <StudentNameModal onSubmit={handleNameSubmit} />}

                {/* Waiting for poll */}
                {view === 'waiting' && (
                    <div className="waiting">
                        <div className="waiting__badge">
                            <svg className="waiting__badge-icon" width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3.5 1.5C3.5 0.671573 4.17157 0 5 0H10C10.8284 0 11.5 0.671573 11.5 1.5V13.5C11.5 14.3284 10.8284 15 10 15H5C4.17157 15 3.5 14.3284 3.5 13.5V1.5Z" fill="white" />
                                <path d="M0 5.5C0 4.67157 0.671573 4 1.5 4H4V13.5C4 14.3284 3.32843 15 2.5 15H1.5C0.671573 15 0 14.3284 0 13.5V5.5Z" fill="white" opacity="0.7" />
                                <path d="M11 8.5C11 7.67157 11.6716 7 12.5 7H13.5C14.3284 7 15 7.67157 15 8.5V13.5C15 14.3284 14.3284 15 13.5 15H12.5C11.6716 15 11 14.3284 11 13.5V8.5Z" fill="white" opacity="0.5" />
                            </svg>
                            <span className="waiting__badge-text">Intervue Poll</span>
                        </div>
                        <div className="waiting__spinner" />
                        <h2 className="waiting__title">
                            Wait for the teacher to ask questions..
                        </h2>
                    </div>
                )}

                {/* Voting — Figma card: dark header + options + submit */}
                {view === 'voting' && poll && (
                    <div className="student-poll">
                        <div className="student-poll__meta">
                            <span className="student-poll__label">Question</span>
                            <Timer timeLeft={timeLeft} totalTime={totalTime} />
                        </div>
                        <div className="student-poll__card">
                            <div className="student-poll__card-header">{poll.question}</div>
                            <div className="student-poll__card-body">
                                {poll.options.map((option, i) => (
                                    <OptionCard
                                        key={option.id}
                                        option={option}
                                        index={i}
                                        isSelected={option.id === pendingOptionId}
                                        isDisabled={timeLeft <= 0}
                                        showResults={false}
                                        voteCounts={voteCounts}
                                        totalVotes={totalVotes}
                                        onClick={() => handleSelectOption(option.id)}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="student-poll__footer">
                            <button
                                className="student-poll__submit"
                                onClick={handleSubmitVote}
                                disabled={!pendingOptionId || timeLeft <= 0}
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                )}

                {/* Voted: live results with fill bars */}
                {view === 'voted' && poll && (
                    <div className="student-poll">
                        <div className="student-poll__meta">
                            <span className="student-poll__label">Question</span>
                            <Timer timeLeft={timeLeft} totalTime={totalTime} />
                        </div>
                        <div className="student-poll__card">
                            <div className="student-poll__card-header">{poll.question}</div>
                            <div className="student-poll__card-body">
                                {poll.options.map((option, i) => (
                                    <OptionCard
                                        key={option.id}
                                        option={option}
                                        index={i}
                                        isSelected={option.id === selectedOptionId}
                                        isDisabled={true}
                                        showResults={true}
                                        voteCounts={voteCounts}
                                        totalVotes={totalVotes}
                                        onClick={() => { }}
                                    />
                                ))}
                            </div>
                        </div>
                        <p className="student-poll__wait-msg">
                            Wait for the teacher to ask a new question..
                        </p>
                    </div>
                )}

                {/* Results: poll ended */}
                {view === 'results' && poll && (
                    <div className="student-poll">
                        <div className="student-poll__meta">
                            <span className="student-poll__label">Question</span>
                            <span className="student-poll__ended-tag">● Poll Ended</span>
                        </div>
                        <div className="student-poll__card">
                            <div className="student-poll__card-header">{poll.question}</div>
                            <div className="student-poll__card-body">
                                {poll.options.map((option, i) => (
                                    <OptionCard
                                        key={option.id}
                                        option={option}
                                        index={i}
                                        isSelected={option.id === selectedOptionId}
                                        isDisabled={true}
                                        showResults={true}
                                        voteCounts={voteCounts}
                                        totalVotes={totalVotes}
                                        onClick={() => { }}
                                    />
                                ))}
                            </div>
                        </div>
                        <p className="student-poll__wait-msg">
                            Wait for the teacher to ask a new question..
                        </p>
                    </div>
                )}

                {/* Kicked out by teacher */}
                {view === 'kicked' && (
                    <div className="kicked">
                        <div className="kicked__card">
                            <div className="kicked__icon">🚫</div>
                            <h2 className="kicked__title">You have been kicked out!</h2>
                            <p className="kicked__message">
                                The teacher removed you from the current poll.
                                You can wait for the next question.
                            </p>
                            <button className="kicked__home-btn" onClick={handleGoHome}>
                                Wait for Next Poll
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentPage;
