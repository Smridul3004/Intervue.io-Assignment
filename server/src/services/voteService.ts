import Vote, { IVote } from '../models/Vote';
import Poll from '../models/Poll';
import { AppError } from '../utils/AppError';

interface SubmitVoteInput {
    pollId: string;
    studentId: string;
    studentName: string;
    optionId: string;
}

interface VoteCountsMap {
    [optionId: string]: number;
}

class VoteService {
    /**
     * Submit a vote for a poll.
     * Validates: poll exists, poll is active, timer not expired, 
     * option exists, student hasn't voted yet.
     */
    async submitVote(input: SubmitVoteInput): Promise<{
        vote: IVote;
        voteCounts: VoteCountsMap;
        totalVotes: number;
    }> {
        const { pollId, studentId, studentName, optionId } = input;

        // 1. Find the poll
        const poll = await Poll.findById(pollId);
        if (!poll) {
            throw new AppError('Poll not found', 404);
        }

        // 2. Check poll is active
        if (poll.status !== 'active') {
            throw new AppError('This poll has already ended', 400);
        }

        // 3. Server-side timer check (SOURCE OF TRUTH)
        const elapsed = (Date.now() - poll.startedAt.getTime()) / 1000;
        if (elapsed >= poll.timeLimit) {
            // Mark poll as completed
            poll.status = 'completed';
            await poll.save();
            throw new AppError('Time has expired for this poll', 400);
        }

        // 4. Validate option exists
        const validOption = poll.options.find((opt) => opt.id === optionId);
        if (!validOption) {
            throw new AppError('Invalid option selected', 400);
        }

        // 5. Check for duplicate vote (also enforced by DB unique index)
        const existingVote = await Vote.findOne({ pollId, studentId });
        if (existingVote) {
            throw new AppError('You have already voted on this poll', 409);
        }

        // 6. Create the vote
        const vote = await Vote.create({
            pollId,
            studentId,
            studentName: studentName.trim(),
            optionId,
        });

        // 7. Get updated vote counts
        const votes = await Vote.find({ pollId });
        const voteCounts: VoteCountsMap = {};
        votes.forEach((v) => {
            voteCounts[v.optionId] = (voteCounts[v.optionId] || 0) + 1;
        });

        return {
            vote,
            voteCounts,
            totalVotes: votes.length,
        };
    }

    /**
     * Check if a specific student has voted on a specific poll.
     */
    async hasStudentVoted(pollId: string, studentId: string): Promise<{
        hasVoted: boolean;
        selectedOptionId?: string;
    }> {
        const vote = await Vote.findOne({ pollId, studentId });
        if (vote) {
            return { hasVoted: true, selectedOptionId: vote.optionId };
        }
        return { hasVoted: false };
    }
}

export default new VoteService();
