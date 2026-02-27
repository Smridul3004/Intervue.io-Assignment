import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import pollRoutes from './routes/pollRoutes';
import errorHandler from './middleware/errorHandler';
import initializeSocket from './socket/socketManager';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io setup with CORS
const io = new SocketIOServer(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
    },
});

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api', pollRoutes);

// Global error handler (must be after routes)
app.use(errorHandler);

// Initialize Socket.io handlers
initializeSocket(io);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
    try {
        // Connect to database
        await connectDB();

        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📡 Socket.io ready`);
            console.log(`🌍 Accepting requests from ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

// Export for use in other modules (e.g., accessing io instance)
export { io, app, server };
