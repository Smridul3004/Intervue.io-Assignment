import { Request, Response } from 'express';
import mongoose from 'mongoose';
import voteService from '../services/voteService';
import catchAsync from '../utils/catchAsync';

class VoteController {
    /**
     * POST /api/polls/:id/vote
     * Submit a vote for a poll.
     */
    submitVote = catchAsync(async (req: Request, res: Response) => {
        if (mongoose.connection.readyState !== 1) {
            res.status(503).json({ success: false, message: 'Database not connected' });
            return;
        }

        const { id: pollId } = req.params;
        const { studentId, studentName, optionId } = req.body;

        const result = await voteService.submitVote({
            pollId,
            studentId,
            studentName,
            optionId,
        });

        res.status(201).json({
            success: true,
            data: result,
        });
    });
}

export default new VoteController();
