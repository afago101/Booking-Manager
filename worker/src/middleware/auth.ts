// Authentication middleware

import { Context, Next } from 'hono';
import { errorResponse } from '../utils/helpers';

export async function adminAuthMiddleware(c: Context, next: Next): Promise<Response | void> {
  const adminKey = c.req.header('x-admin-key');
  const expectedKey = c.env.ADMIN_API_KEY;

  if (!adminKey || adminKey !== expectedKey) {
    return errorResponse('Unauthorized: Invalid or missing admin key', 'UNAUTHORIZED', 401);
  }

  await next();
}

