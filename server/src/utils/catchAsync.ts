import { Request, Response, NextFunction } from 'express';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;

/**
 * Wraps an async Express route handler so that any rejected promise
 * is automatically forwarded to Express error handling middleware.
 */
const catchAsync = (fn: AsyncHandler) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        fn(req, res, next).catch(next);
    };
};

export default catchAsync;
