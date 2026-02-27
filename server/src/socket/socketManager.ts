import { Server as SocketIOServer, Socket } from 'socket.io';
import mongoose from 'mongoose';
import pollService from '../services/pollService';
import voteService from '../services/voteService';
import studentService from '../services/studentService';

// Store active poll timers (pollId -> timeout handle)
const pollTimers: Map<string, NodeJS.Timeout> = new Map();

/** Returns true when MongoDB is connected and ready */
const isDbReady = () => mongoose.connection.readyState === 1;

/** Default empty state sent when DB is not connected */
const emptyState = (extra: Record<string, unknown> = {}) => ({
    poll: null,
    remainingTime: 0,
    voteCounts: {},
    totalVotes: 0,
    studentCount: 0,
    ...extra,
});

/**
 * Starts a server-side timer for a poll.
 * When it expires, marks the poll as completed and broadcasts poll:ended.
 */
const startPollTimer = (io: SocketIOServer, pollId: string, remainingMs: number): void => {
    // Clear any existing timer for this poll
    const existing = pollTimers.get(pollId);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(async () => {
        try {
            const poll = await pollService.completePoll(pollId);
            if (poll) {
                const { voteCounts, totalVotes } = await pollService.getVoteCounts(pollId);
                io.emit('poll:ended', {
                    pollId,
                    finalResults: voteCounts,
                    totalVotes,
                });
                console.log(`⏰ Poll ${pollId} ended by timer`);
            }
        } catch (error) {
            console.error('Error completing poll by timer:', error);
        } finally {
            pollTimers.delete(pollId);
        }
    }, remainingMs);

    pollTimers.set(pollId, timer);
};

/**
 * On server start, check for any active poll and resume its timer.
 */
const resumeActivePolls = async (io: SocketIOServer): Promise<void> => {
    if (!isDbReady()) {
        console.log('⏭️  Skipping poll resume — DB not connected');
        return;
    }
    try {
        const result = await pollService.getActivePoll();
        if (result && result.remainingTime > 0) {
            console.log(`🔄 Resuming timer for active poll: ${result.poll._id} (${result.remainingTime}s remaining)`);
            startPollTimer(io, (result.poll._id as any).toString(), result.remainingTime * 1000);
        }
    } catch (error) {
        console.error('Error resuming active polls:', error);
    }
};

/**
 * Initializes all Socket.io event handlers.
 * Each handler delegates to service functions — no business logic here.
 */
const initializeSocket = (io: SocketIOServer): void => {
    // Resume any active poll timers on server start
    resumeActivePolls(io);

    io.on('connection', (socket: Socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);

        // ─── Teacher Events ───

        socket.on('teacher:join', async () => {
            socket.join('teacher');
            console.log(`👩‍🏫 Teacher joined: ${socket.id}`);

            if (!isDbReady()) {
                socket.emit('poll:state', emptyState());
                return;
            }

            try {
                const result = await pollService.getActivePoll();
                const studentCount = await studentService.getActiveStudentCount();

                if (result) {
                    socket.emit('poll:state', {
                        poll: result.poll,
                        remainingTime: result.remainingTime,
                        voteCounts: result.voteCounts,
                        totalVotes: result.totalVotes,
                        studentCount,
                    });
                } else {
                    socket.emit('poll:state', {
                        poll: null,
                        remainingTime: 0,
                        voteCounts: {},
                        totalVotes: 0,
                        studentCount,
                    });
                }
            } catch (error) {
                console.error('Error on teacher:join:', error);
                socket.emit('poll:state', emptyState());
            }
        });

        // ─── Student Events ───

        socket.on('student:join', async (data: { sessionId: string; name: string }) => {
            socket.join('students');
            // Store sessionId on the socket for later reference
            (socket as any).sessionId = data.sessionId;

            if (!isDbReady()) {
                socket.emit('poll:state', emptyState({ hasVoted: false }));
                console.log(`🎓 Student joined (no DB): ${data.name} (${socket.id})`);
                return;
            }

            try {
                // Update the student's socket ID
                await studentService.updateSocketId(data.sessionId, socket.id);

                // Get current state
                const result = await pollService.getActivePoll();
                const studentCount = await studentService.getActiveStudentCount();

                // Broadcast updated student count to everyone
                io.emit('student:count', { count: studentCount });

                if (result) {
                    const { hasVoted, selectedOptionId } = await voteService.hasStudentVoted(
                        (result.poll._id as any).toString(),
                        data.sessionId
                    );

                    socket.emit('poll:state', {
                        poll: result.poll,
                        remainingTime: result.remainingTime,
                        voteCounts: result.voteCounts,
                        totalVotes: result.totalVotes,
                        hasVoted,
                        selectedOptionId,
                        studentCount,
                    });
                } else {
                    socket.emit('poll:state', {
                        poll: null,
                        remainingTime: 0,
                        voteCounts: {},
                        totalVotes: 0,
                        hasVoted: false,
                        studentCount,
                    });
                }

                console.log(`🎓 Student joined: ${data.name} (${socket.id})`);
            } catch (error) {
                console.error('Error on student:join:', error);
                socket.emit('poll:state', emptyState({ hasVoted: false }));
            }
        });

        // ─── Poll Creation (Teacher) ───

        socket.on('poll:create', async (data: {
            question: string;
            options: string[];
            timeLimit?: number;
        }) => {
            if (!isDbReady()) {
                socket.emit('error', { message: 'Database not connected. Cannot create poll.' });
                return;
            }

            try {
                const poll = await pollService.createPoll(data);
                const pollId = (poll._id as any).toString();
                const remainingTime = poll.timeLimit;

                // Start server-side timer
                startPollTimer(io, pollId, remainingTime * 1000);

                // Broadcast new poll to ALL clients
                io.emit('poll:new', { poll, remainingTime });

                console.log(`📊 New poll created: "${data.question}" (${remainingTime}s)`);
            } catch (error: any) {
                console.error('Error creating poll:', error);
                socket.emit('error', {
                    message: error.message || 'Failed to create poll',
                });
            }
        });

        // ─── Vote Submission (Student) ───

        socket.on('poll:vote', async (data: {
            pollId: string;
            studentId: string;
            studentName: string;
            optionId: string;
        }) => {
            if (!isDbReady()) {
                socket.emit('poll:vote-rejected', { message: 'Database not connected. Cannot vote.' });
                return;
            }

            try {
                const result = await voteService.submitVote(data);

                // Acknowledge the vote to the student
                socket.emit('poll:vote-accepted', {
                    pollId: data.pollId,
                    optionId: data.optionId,
                });

                // Broadcast updated results to ALL clients
                io.emit('poll:results-update', {
                    pollId: data.pollId,
                    voteCounts: result.voteCounts,
                    totalVotes: result.totalVotes,
                });

                console.log(`🗳️  Vote received: ${data.studentName} → option ${data.optionId}`);
            } catch (error: any) {
                console.error('Error submitting vote:', error);
                socket.emit('poll:vote-rejected', {
                    message: error.message || 'Failed to submit vote',
                });
            }
        });

        // ─── Disconnect ───

        socket.on('disconnect', async () => {
            const sessionId = (socket as any).sessionId;
            if (sessionId && isDbReady()) {
                try {
                    await studentService.updateSocketId(sessionId, null);
                    const studentCount = await studentService.getActiveStudentCount();
                    io.emit('student:count', { count: studentCount });
                } catch (error) {
                    console.error('Error on disconnect:', error);
                }
            }
            console.log(`🔌 Client disconnected: ${socket.id}`);
        });
    });
};

export default initializeSocket;
