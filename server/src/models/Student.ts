import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent extends Document {
    name: string;
    sessionId: string;     // unique per browser tab (stored in sessionStorage)
    socketId: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
    {
        name: {
            type: String,
            required: [true, 'Student must have a name'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
        },
        sessionId: {
            type: String,
            required: [true, 'Student must have a session ID'],
            unique: true,
        },
        socketId: {
            type: String,
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// sessionId already has `unique: true` which creates an index — no need for a separate index

const Student = mongoose.model<IStudent>('Student', StudentSchema);

export default Student;
