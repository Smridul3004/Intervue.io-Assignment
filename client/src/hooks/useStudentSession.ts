import { useState, useCallback } from 'react';

interface StudentSession {
    name: string;
    sessionId: string;
}

const STORAGE_KEY = 'polling-student-session';

/**
 * Manages student session persistence via localStorage.
 * On first visit, session is null (triggers name modal).
 * Once created, session survives page refreshes and tab closes.
 */
const useStudentSession = () => {
    const [session, setSession] = useState<StudentSession | null>(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored) as StudentSession;
            } catch {
                return null;
            }
        }
        return null;
    });

    const createSession = useCallback((name: string): StudentSession => {
        const newSession: StudentSession = {
            name: name.trim(),
            sessionId: crypto.randomUUID(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
        setSession(newSession);
        return newSession;
    }, []);

    const clearSession = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setSession(null);
    }, []);

    return { session, createSession, clearSession };
};

export default useStudentSession;
