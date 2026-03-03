import type { Context } from 'hono';
import { ZodError } from 'zod';
import { HTTP_STATUS, MESSAGES } from '../configs/constants.ts';
import { errorResponse } from '../utils/response.ts';
import { logger } from '../utils/logger.ts';
import { configApp } from '../configs/index.ts';
import { AppError, ConflictError, ValidationError, InvalidTokenError } from '../utils/errors.ts';

/**
 * Transforms external/driver errors into Unified AppErrors
 */
const transformError = (err: any): Error => {
  // 1. MySQL/Postgres Duplicate Entry
  if (err.message?.includes('Duplicate entry') || err.code === '23505') {
    return new ConflictError('The data you provided already exists (Duplicate Entry).');
  }

  // 3. MongoDB Duplicate Key
  if (err.code === 11000) {
    return new ConflictError('A record with this unique value already exists in MongoDB.');
  }

  // 4. JWT Errors (Hono library errors)
  if (err.name === 'JwtTokenSignatureMismatched' || err.message?.includes('signature mismatched')) {
    return new InvalidTokenError('The security token signature is invalid. Please generate a new token.');
  }

  if (err.name === 'JwtTokenExpired') {
    return new InvalidTokenError('M2M Token has expired. Please generate a new one.');
  }

  if (err.name === 'JwtTokenInvalid') {
    return new InvalidTokenError('Invalid M2M Token. Please check your credentials.');
  }

  return err;
};

/**
 * Main Error Handler for app.onError()
 */
export const errorHandler = async (err: Error, c: Context): Promise<Response> => {
  // 1. Transform the error if needed
  const error = transformError(err);

  // 2. Log full details internally
  logger.error(error.message, {
    name: error.name,
    stack: error.stack,
    path: c.req.path,
    requestId: c.get('requestId')
  });

  // 3. Handle Unified AppErrors or any error with a statusCode
  const statusCode = (error as any).statusCode || (error as any).status;

  if (typeof statusCode === 'number' && statusCode >= 400 && statusCode < 600) {
    return errorResponse(c, error.message, statusCode, (error as any).data);
  }

  // 4. Handle System/Unknown Errors (The Mask)
  const isProduction = configApp.isProduction;
  const message = isProduction ? MESSAGES.INTERNAL_ERROR : error.message;
  const data = isProduction ? null : { stack: error.stack };

  return errorResponse(c, message, HTTP_STATUS.INTERNAL_SERVER_ERROR, data);
};
