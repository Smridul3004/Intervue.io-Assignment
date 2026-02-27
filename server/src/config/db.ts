import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
    try {
        const dbUrl = process.env.DATABASE_URL || 'mongodb://localhost:27017/live-polling';
        await mongoose.connect(dbUrl, {
            serverSelectionTimeoutMS: 10000,
        });
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        // Per assignment requirement: app should NOT crash if DB is temporarily unreachable
        console.warn('⚠️  Server will continue running without database. Some features may be unavailable.');
    }
};

export default connectDB;
