import { Request, Response } from 'express';
import mongoose from 'mongoose';
import studentService from '../services/studentService';
import catchAsync from '../utils/catchAsync';

class StudentController {
    /**
     * POST /api/students/register
     */
    register = catchAsync(async (req: Request, res: Response) => {
        if (mongoose.connection.readyState !== 1) {
            res.status(503).json({ success: false, message: 'Database not connected' });
            return;
        }

        const { name, sessionId } = req.body;
        const student = await studentService.registerStudent(name, sessionId);

        res.status(201).json({
            success: true,
            data: student,
        });
    });

    /**
     * GET /api/students/:sessionId
     * Get student info by session ID (for state recovery on refresh).
     */
    getBySessionId = catchAsync(async (req: Request, res: Response) => {
        const sessionId = req.params.sessionId as string;
        const student = await studentService.getBySessionId(sessionId);

        if (!student) {
            res.status(404).json({
                success: false,
                message: 'Student not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: student,
        });
    });
}

export default new StudentController();
