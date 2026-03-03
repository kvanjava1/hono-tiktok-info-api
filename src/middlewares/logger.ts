import type { Context, Next } from 'hono';
import { logger } from '../utils/logger.ts';

export const requestLoggerMiddleware = async (c: Context, next: Next): Promise<void> => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;
  const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
  const reqId = c.get('requestId');

  logger.info(`[${method}] ${path} - IP: ${ip} [ID: ${reqId}]`);

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  logger.info(`[${method}] ${path} - ${status} - ${duration}ms [ID: ${reqId}]`);
};
