import Poll, { IPoll } from '../models/Poll';
import Vote from '../models/Vote';
import { AppError } from '../utils/AppError';
import crypto from 'crypto';

interface CreatePollInput {
    question: string;
    options: string[];
    timeLimit?: number;
}

interface VoteCountsMap {
    [optionId: string]: number;
}

class PollService {
    async createPoll(input: CreatePollInput): Promise<IPoll> {
        const { question, options, timeLimit = 60 } = input;

        if (!question || question.trim().length < 3) {
            throw new AppError('Question must be at least 3 characters', 400);
        }
        if (!options || options.length < 2) {
            throw new AppError('A poll must have at least 2 options', 400);
        }
        if (timeLimit < 10 || timeLimit > 120) {
            throw new AppError('Time limit must be between 10 and 120 seconds', 400);
        }

        const activePoll = await Poll.findOne({ status: 'active' });
        if (activePoll) {
            const elapsed = (Date.now() - activePoll.startedAt.getTime()) / 1000;
            if (elapsed >= activePoll.timeLimit) {
                activePoll.status = 'completed';
                await activePoll.save();
            } else {
                throw new AppError('Cannot create a new poll while one is still active', 409);
            }
        }

        const pollOptions = options.map((text) => ({
            id: crypto.randomUUID(),
            text: text.trim(),
        }));

        const poll = await Poll.create({
            question: question.trim(),
            options: pollOptions,
            timeLimit,
            status: 'active',
            startedAt: new Date(),
        });

        return poll;
    }

    async getActivePoll(): Promise<{
        poll: IPoll;
        remainingTime: number;
        voteCounts: VoteCountsMap;
        totalVotes: number;
    } | null> {
        const poll = await Poll.findOne({ status: 'active' });
        if (!poll) return null;

        const elapsed = (Date.now() - poll.startedAt.getTime()) / 1000;
        const remainingTime = Math.max(0, poll.timeLimit - elapsed);

        if (remainingTime <= 0) {
            poll.status = 'completed';
            await poll.save();
        }

        const { voteCounts, totalVotes } = await this.getVoteCounts((poll._id as unknown as string));

        return {
            poll,
            remainingTime: Math.floor(remainingTime),
            voteCounts,
            totalVotes,
        };
    }

    async getPollById(pollId: string): Promise<{
        poll: IPoll;
        voteCounts: VoteCountsMap;
        totalVotes: number;
    }> {
        const poll = await Poll.findById(pollId);
        if (!poll) {
            throw new AppError('Poll not found', 404);
        }

        const { voteCounts, totalVotes } = await this.getVoteCounts(pollId);
        return { poll, voteCounts, totalVotes };
    }

    async getPollHistory(): Promise<Array<{
        poll: IPoll;
        voteCounts: VoteCountsMap;
        totalVotes: number;
    }>> {
        const polls = await Poll.find({ status: 'completed' })
            .sort({ createdAt: -1 })
            .lean();

        const results = await Promise.all(
            polls.map(async (poll) => {
                const { voteCounts, totalVotes } = await this.getVoteCounts(
                    (poll._id as any).toString()
                );
                return { poll: poll as unknown as IPoll, voteCounts, totalVotes };
            })
        );

        return results;
    }

    async completePoll(pollId: string): Promise<IPoll | null> {
        const poll = await Poll.findByIdAndUpdate(
            pollId,
            { status: 'completed' },
            { new: true }
        );
        return poll;
    }

    async getVoteCounts(pollId: string): Promise<{
        voteCounts: VoteCountsMap;
        totalVotes: number;
    }> {
        const votes = await Vote.find({ pollId });
        const voteCounts: VoteCountsMap = {};

        votes.forEach((vote) => {
            voteCounts[vote.optionId] = (voteCounts[vote.optionId] || 0) + 1;
        });

        return {
            voteCounts,
            totalVotes: votes.length,
        };
    }
}

export default new PollService();
