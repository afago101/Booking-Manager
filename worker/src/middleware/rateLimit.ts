// Rate limiting middleware

import { Context, Next } from 'hono';
import { checkRateLimit, errorResponse } from '../utils/helpers';

export async function rateLimitMiddleware(c: Context, next: Next): Promise<Response | void> {
  // Get identifier from IP or a header
  const identifier = c.req.header('cf-connecting-ip') || 'unknown';
  
  const limit = 60; // requests per minute
  const windowMs = 60000; // 1 minute

  if (!checkRateLimit(identifier, limit, windowMs)) {
    return errorResponse('Rate limit exceeded. Please try again later.', 'TOO_MANY_REQUESTS', 429);
  }

  await next();
}

