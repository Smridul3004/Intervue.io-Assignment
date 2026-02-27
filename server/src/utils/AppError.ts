export class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        // Capture stack trace, excluding the constructor call from the trace
        Error.captureStackTrace(this, this.constructor);
    }
}
