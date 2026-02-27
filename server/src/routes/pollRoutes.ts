import { Router, Request, Response } from 'express';
import pollController from '../controllers/pollController';
import voteController from '../controllers/voteController';
import studentController from '../controllers/studentController';

const pollRoutes = Router();

// Health check
pollRoutes.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Poll routes
pollRoutes.post('/polls', pollController.createPoll);
pollRoutes.get('/polls/active', pollController.getActivePoll);
pollRoutes.get('/polls/history', pollController.getPollHistory);
pollRoutes.get('/polls/:id', pollController.getPollById);

// Vote routes
pollRoutes.post('/polls/:id/vote', voteController.submitVote);

// Student routes
pollRoutes.post('/students/register', studentController.register);
pollRoutes.get('/students/:sessionId', studentController.getBySessionId);

export default pollRoutes;
