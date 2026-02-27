import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Client-side countdown timer synced with server time.
 * Uses Date.now() for drift-resistant timing rather than
 * incrementing/decrementing on each interval tick.
 */
const usePollTimer = () => {
    const [timeLeft, setTimeLeft] = useState(0);
    const [totalTime, setTotalTime] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const endTimeRef = useRef<number>(0);

    const clearTimer = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const startTimer = useCallback((seconds: number) => {
        clearTimer();
        setTotalTime(seconds);
        setTimeLeft(seconds);
        endTimeRef.current = Date.now() + seconds * 1000;

        intervalRef.current = setInterval(() => {
            const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
            setTimeLeft(remaining);
            if (remaining <= 0) {
                clearTimer();
            }
        }, 250); // 250ms for smooth updates without excessive renders
    }, [clearTimer]);

    const stopTimer = useCallback(() => {
        clearTimer();
        setTimeLeft(0);
        setTotalTime(0);
    }, [clearTimer]);

    // Cleanup on unmount
    useEffect(() => {
        return clearTimer;
    }, [clearTimer]);

    return { timeLeft, totalTime, startTimer, stopTimer };
};

export default usePollTimer;
