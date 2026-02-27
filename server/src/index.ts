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

// Allow any localhost port in dev; use CLIENT_URL env var in production
const allowedOrigin = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow server-to-server / Postman requests with no origin
    if (!origin) return callback(null, true);
    const clientUrl = process.env.CLIENT_URL;
    if (clientUrl && origin === clientUrl) return callback(null, true);
    // Allow any localhost or 127.0.0.1 origin during local development
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
};

// Socket.io setup with CORS
const io = new SocketIOServer(server, {
    cors: {
        origin: allowedOrigin,
        methods: ['GET', 'POST'],
    },
});

// Middleware
app.use(cors({
    origin: allowedOrigin,
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
            console.log(`🌍 Accepting requests from ${process.env.CLIENT_URL || 'localhost (any port)'}`);
        }).on('error', (err: NodeJS.ErrnoException) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`❌ Port ${PORT} is already in use. Kill the other process or use a different port.`);
                process.exit(1);
            }
            throw err;
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

// Export for use in other modules (e.g., accessing io instance)
export { io, app, server };
