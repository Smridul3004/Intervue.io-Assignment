import { Request, Response } from 'express';
import mongoose from 'mongoose';
import pollService from '../services/pollService';
import catchAsync from '../utils/catchAsync';

/** Returns true if MongoDB is connected and ready for queries */
const isDbReady = () => mongoose.connection.readyState === 1;

class PollController {
    /**
     * POST /api/polls
     * Create a new poll.
     */
    createPoll = catchAsync(async (req: Request, res: Response) => {
        if (!isDbReady()) {
            res.status(503).json({ success: false, message: 'Database not connected' });
            return;
        }

        const { question, options, timeLimit } = req.body;
        const poll = await pollService.createPoll({ question, options, timeLimit });

        res.status(201).json({
            success: true,
            data: poll,
        });
    });

    /**
     * GET /api/polls/active
     * Get the currently active poll with remaining time and vote counts.
     */
    getActivePoll = catchAsync(async (_req: Request, res: Response) => {
        if (!isDbReady()) {
            res.status(200).json({ success: true, data: null, message: 'Database not connected' });
            return;
        }

        const result = await pollService.getActivePoll();

        if (!result) {
            res.status(200).json({
                success: true,
                data: null,
                message: 'No active poll',
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: result,
        });
    });

    /**
     * GET /api/polls/history
     * Get all completed polls with their results.
     */
    getPollHistory = catchAsync(async (_req: Request, res: Response) => {
        if (!isDbReady()) {
            res.status(200).json({ success: true, data: [], message: 'Database not connected' });
            return;
        }

        const history = await pollService.getPollHistory();

        res.status(200).json({
            success: true,
            data: history,
        });
    });

    /**
     * GET /api/polls/:id
     * Get a specific poll by ID with results.
     */
    getPollById = catchAsync(async (req: Request, res: Response) => {
        if (!isDbReady()) {
            res.status(503).json({ success: false, message: 'Database not connected' });
            return;
        }

        const id = req.params.id as string;
        const result = await pollService.getPollById(id);

        res.status(200).json({
            success: true,
            data: result,
        });
    });
}

export default new PollController();
