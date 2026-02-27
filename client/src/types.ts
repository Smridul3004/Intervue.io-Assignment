// ============================================
// Client-side types for the Live Polling System
// Mirror of shared/types.ts
// ============================================

// ─── Auth Types ───

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: 'teacher' | 'student';
}

export interface AuthState {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

// ─── Poll Types ───

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

export interface CreatePollPayload {
    question: string;
    options: string[];
    timeLimit?: number;
}

export interface SubmitVotePayload {
    pollId: string;
    studentId: string;
    optionId: string;
}

export interface StudentData {
    _id: string;
    name: string;
    sessionId: string;
    isActive: boolean;
}

// --- Socket Event Payloads ---

export interface PollStatePayload {
    poll: PollData | null;
    remainingTime: number;
    voteCounts: VoteCounts;
    totalVotes: number;
    hasVoted?: boolean;
    selectedOptionId?: string;
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
