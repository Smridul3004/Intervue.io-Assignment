import mongoose, { Schema, Document } from 'mongoose';

export interface IVote extends Document {
    pollId: mongoose.Types.ObjectId;
    studentId: string;     // session-based unique ID per tab
    studentName: string;
    optionId: string;      // matches the option.id in the Poll
    createdAt: Date;
}

const VoteSchema = new Schema<IVote>(
    {
        pollId: {
            type: Schema.Types.ObjectId,
            ref: 'Poll',
            required: [true, 'Vote must belong to a poll'],
            index: true,
        },
        studentId: {
            type: String,
            required: [true, 'Vote must have a student session ID'],
        },
        studentName: {
            type: String,
            required: [true, 'Vote must have a student name'],
            trim: true,
        },
        optionId: {
            type: String,
            required: [true, 'Vote must have a selected option'],
        },
    },
    {
        timestamps: true,
    }
);

// CRITICAL: Compound unique index prevents duplicate votes per student per poll
// This is the database-level enforcement against race conditions
VoteSchema.index({ pollId: 1, studentId: 1 }, { unique: true });

const Vote = mongoose.model<IVote>('Vote', VoteSchema);

export default Vote;
