import mongoose, { Schema, Document } from 'mongoose';

export interface IPollOption {
    id: string;
    text: string;
}

export interface IPoll extends Document {
    question: string;
    options: IPollOption[];
    timeLimit: number;           // in seconds
    status: 'active' | 'completed';
    startedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const PollOptionSchema = new Schema<IPollOption>(
    {
        id: { type: String, required: true },
        text: { type: String, required: true, trim: true },
    },
    { _id: false }
);

const PollSchema = new Schema<IPoll>(
    {
        question: {
            type: String,
            required: [true, 'A poll must have a question'],
            trim: true,
            minlength: [3, 'Question must be at least 3 characters'],
        },
        options: {
            type: [PollOptionSchema],
            validate: {
                validator: (v: IPollOption[]) => v.length >= 2,
                message: 'A poll must have at least 2 options',
            },
        },
        timeLimit: {
            type: Number,
            required: true,
            default: 60,
            min: [10, 'Time limit must be at least 10 seconds'],
            max: [120, 'Time limit cannot exceed 120 seconds'],
        },
        status: {
            type: String,
            enum: ['active', 'completed'],
            default: 'active',
        },
        startedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true, // adds createdAt and updatedAt automatically
    }
);

// Index for quickly finding the active poll
PollSchema.index({ status: 1 });

const Poll = mongoose.model<IPoll>('Poll', PollSchema);

export default Poll;
