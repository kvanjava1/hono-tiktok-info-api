import { HTTP_STATUS, MESSAGES } from '../configs/constants.ts';

/**
 * Base Application Error
 */
export class AppError extends Error {
    constructor(
        message: string,
        public statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
        public isOperational: boolean = true,
        public data: any = null
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message: string = MESSAGES.VALIDATION_ERROR, details: any = null) {
        super(message, HTTP_STATUS.BAD_REQUEST, true, details);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = MESSAGES.USER_NOT_FOUND) {
        super(message, HTTP_STATUS.NOT_FOUND);
    }
}

export class DatabaseError extends AppError {
    constructor(message: string = MESSAGES.DATABASE_ERROR) {
        super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, HTTP_STATUS.BAD_REQUEST);
    }
}

export class DuplicateOrderError extends AppError {
    constructor(orderId: string) {
        // 409 Conflict is the standard for duplicates
        super(`Order with ID ${orderId} has already been processed`, 409);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized') {
        super(message, HTTP_STATUS.UNAUTHORIZED);
    }
}

export class InvalidTokenError extends AppError {
    constructor(message: string = 'Invalid or expired token signature') {
        super(message, HTTP_STATUS.UNAUTHORIZED);
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden') {
        super(message, HTTP_STATUS.FORBIDDEN);
    }
}

export class RateLimitError extends AppError {
    constructor(message: string = MESSAGES.RATE_LIMIT_EXCEEDED) {
        super(message, HTTP_STATUS.TOO_MANY_REQUESTS);
    }
}

export class ScrapingError extends AppError {
    constructor(message: string = 'Failed to extract data from target source') {
        super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
}
