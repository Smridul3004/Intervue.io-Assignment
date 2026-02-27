import Student, { IStudent } from '../models/Student';
import { AppError } from '../utils/AppError';

class StudentService {
    /**
     * Register a new student or return existing one by sessionId.
     */
    async registerStudent(name: string, sessionId: string): Promise<IStudent> {
        if (!name || name.trim().length < 2) {
            throw new AppError('Name must be at least 2 characters', 400);
        }
        if (!sessionId) {
            throw new AppError('Session ID is required', 400);
        }

        // Check if student already exists with this sessionId
        const existing = await Student.findOne({ sessionId });
        if (existing) {
            // Update name if different and mark as active
            existing.name = name.trim();
            existing.isActive = true;
            await existing.save();
            return existing;
        }

        // Create new student
        const student = await Student.create({
            name: name.trim(),
            sessionId,
            isActive: true,
        });

        return student;
    }

    /**
     * Get student by sessionId (for state recovery on refresh).
     */
    async getBySessionId(sessionId: string): Promise<IStudent | null> {
        return Student.findOne({ sessionId });
    }

    /**
     * Update the socket ID when a student connects/reconnects.
     */
    async updateSocketId(sessionId: string, socketId: string | null): Promise<void> {
        await Student.findOneAndUpdate(
            { sessionId },
            { socketId, isActive: socketId !== null }
        );
    }

    /**
     * Get count of currently active (connected) students.
     */
    async getActiveStudentCount(): Promise<number> {
        return Student.countDocuments({ isActive: true, socketId: { $ne: null } });
    }

    /**
     * Remove a student (teacher action).
     */
    async removeStudent(sessionId: string): Promise<IStudent | null> {
        const student = await Student.findOneAndUpdate(
            { sessionId },
            { isActive: false, socketId: null },
            { new: true }
        );
        return student;
    }
}

export default new StudentService();
