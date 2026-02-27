// ============================================
// Shared types used by both client and server
// ============================================

// --- Poll Types ---

export interface PollOption {
    id: string;
    text: string;
}

export interface PollData {
    _id: string;
    question: string;
    options: PollOption[];
    timeLimit: number;
    status: 'active' | 'completed';
    startedAt: string;
    createdAt: string;
}

export interface VoteCounts {
    [optionId: string]: number;
}

export interface PollResults {
    pollId: string;
    voteCounts: VoteCounts;
    totalVotes: number;
}

// --- Create Poll ---

export interface CreatePollPayload {
    question: string;
    options: string[];       // Array of option text strings
    timeLimit?: number;       // Optional, defaults to 60
}

// --- Vote ---

export interface SubmitVotePayload {
    pollId: string;
    studentId: string;
    optionId: string;
}

// --- Student ---

export interface StudentData {
    _id: string;
    name: string;
    sessionId: string;
    isActive: boolean;
}

// --- Socket Events ---

export interface PollStatePayload {
    poll: PollData | null;
    remainingTime: number;
    voteCounts: VoteCounts;
    totalVotes: number;
    hasVoted?: boolean;       // Only sent to students
    selectedOptionId?: string; // Only sent to students who already voted
    studentCount: number;
}

export interface PollNewPayload {
    poll: PollData;
    remainingTime: number;
}

export interface PollEndedPayload {
    pollId: string;
    finalResults: VoteCounts;
    totalVotes: number;
}

export interface ResultsUpdatePayload {
    pollId: string;
    voteCounts: VoteCounts;
    totalVotes: number;
}

// --- API Responses ---

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
}

export interface PollHistoryItem {
    _id: string;
    question: string;
    options: PollOption[];
    timeLimit: number;
    status: 'completed';
    startedAt: string;
    createdAt: string;
    voteCounts: VoteCounts;
    totalVotes: number;
}
