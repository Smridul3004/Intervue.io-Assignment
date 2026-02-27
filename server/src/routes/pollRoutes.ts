import { Router, Request, Response } from 'express';
import pollController from '../controllers/pollController';
import voteController from '../controllers/voteController';
import studentController from '../controllers/studentController';
import authController from '../controllers/authController';
import { authenticate, authorize } from '../middleware/auth';

const pollRoutes = Router();

// Health check
pollRoutes.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Auth routes (public) ───
pollRoutes.post('/auth/register', authController.register);
pollRoutes.post('/auth/login', authController.login);
pollRoutes.get('/auth/me', authenticate, authController.getMe);

// ─── Poll routes ───
pollRoutes.post('/polls', authenticate, authorize('teacher'), pollController.createPoll);
pollRoutes.get('/polls/active', pollController.getActivePoll);
pollRoutes.get('/polls/history', pollController.getPollHistory);
pollRoutes.get('/polls/:id', pollController.getPollById);

// Vote routes (authenticated students)
pollRoutes.post('/polls/:id/vote', authenticate, authorize('student'), voteController.submitVote);

// Student routes
pollRoutes.post('/students/register', studentController.register);
pollRoutes.get('/students/:sessionId', studentController.getBySessionId);

export default pollRoutes;
