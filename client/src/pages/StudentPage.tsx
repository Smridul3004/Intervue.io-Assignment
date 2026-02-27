import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import useSocket from '../hooks/useSocket';
import useStudentSession from '../hooks/useStudentSession';
import usePollTimer from '../hooks/usePollTimer';
import Header from '../components/Header';
import Timer from '../components/Timer';
import OptionCard from '../components/OptionCard';
import ResultsBar from '../components/ResultsBar';
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

type ViewState = 'onboarding' | 'waiting' | 'voting' | 'voted' | 'results';

const StudentPage = () => {
    const { socket, isConnected } = useSocket();
    const { session, createSession } = useStudentSession();

    const [view, setView] = useState<ViewState>(session ? 'waiting' : 'onboarding');
    const [poll, setPoll] = useState<PollData | null>(null);
    const [voteCounts, setVoteCounts] = useState<VoteCounts>({});
    const [totalVotes, setTotalVotes] = useState(0);
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
    const [studentCount, setStudentCount] = useState(0);

    const { timeLeft, totalTime, startTimer, stopTimer } = usePollTimer();

    // Join as student when socket + session are ready
    useEffect(() => {
        if (!socket || !session) return;

        socket.emit('student:join', {
            sessionId: session.sessionId,
            name: session.name,
        });

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
            setPoll(data.poll);
            setVoteCounts({});
            setTotalVotes(0);
            setSelectedOptionId(null);
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

        socket.on('poll:state', handleState);
        socket.on('poll:new', handleNew);
        socket.on('poll:vote-accepted', handleVoteAccepted);
        socket.on('poll:vote-rejected', handleVoteRejected);
        socket.on('poll:results-update', handleResults);
        socket.on('poll:ended', handleEnded);
        socket.on('student:count', handleStudentCount);
        socket.on('error', handleError);

        return () => {
            socket.off('poll:state', handleState);
            socket.off('poll:new', handleNew);
            socket.off('poll:vote-accepted', handleVoteAccepted);
            socket.off('poll:vote-rejected', handleVoteRejected);
            socket.off('poll:results-update', handleResults);
            socket.off('poll:ended', handleEnded);
            socket.off('student:count', handleStudentCount);
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

    // Handle vote
    const handleVote = useCallback(
        (optionId: string) => {
            if (!socket || !session || !poll) return;

            socket.emit('poll:vote', {
                pollId: poll._id,
                studentId: session.sessionId,
                studentName: session.name,
                optionId,
            });
        },
        [socket, session, poll]
    );

    return (
        <div className="page">
            <Header
                title={session ? `Hi, ${session.name}!` : 'Student View'}
                isConnected={isConnected}
                studentCount={studentCount}
                showBack
            />

            <div className="page__content">
                {/* Onboarding: name modal */}
                {view === 'onboarding' && <StudentNameModal onSubmit={handleNameSubmit} />}

                {/* Waiting for poll */}
                {view === 'waiting' && (
                    <div className="waiting">
                        <div className="waiting__icon">⏳</div>
                        <h2 className="waiting__title">
                            Waiting for question
                            <span className="waiting__dot-animation" />
                        </h2>
                        <p className="waiting__subtitle">
                            The teacher will start a poll shortly. Stay tuned!
                        </p>
                    </div>
                )}

                {/* Voting */}
                {view === 'voting' && poll && (
                    <div className="voting">
                        <div className="voting__card">
                            <h2 className="voting__question">{poll.question}</h2>
                            <div className="voting__timer-row">
                                <Timer timeLeft={timeLeft} totalTime={totalTime} />
                            </div>
                            <div className="voting__options">
                                {poll.options.map((option, i) => (
                                    <OptionCard
                                        key={option.id}
                                        option={option}
                                        index={i}
                                        isSelected={false}
                                        isDisabled={timeLeft <= 0}
                                        showResults={false}
                                        voteCounts={voteCounts}
                                        totalVotes={totalVotes}
                                        onClick={() => handleVote(option.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Voted: show live results */}
                {view === 'voted' && poll && (
                    <div className="voting">
                        <div className="voting__card">
                            <h2 className="voting__question">{poll.question}</h2>
                            <div className="voting__timer-row">
                                <Timer timeLeft={timeLeft} totalTime={totalTime} />
                            </div>
                            <div className="voting__submitted">✅ Your vote has been recorded</div>
                            <div className="voting__options">
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
                            <div className="active-poll__total">
                                {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} so far
                            </div>
                        </div>
                    </div>
                )}

                {/* Results: poll ended */}
                {view === 'results' && poll && (
                    <div className="voting">
                        <div className="voting__card">
                            <span className="active-poll__status active-poll__status--ended" style={{ display: 'inline-flex', marginBottom: '1rem' }}>
                                ● Poll Ended
                            </span>
                            <h2 className="voting__question">{poll.question}</h2>
                            <ResultsBar
                                options={poll.options}
                                voteCounts={voteCounts}
                                totalVotes={totalVotes}
                            />
                            <div className="active-poll__total">
                                Final results — {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentPage;
