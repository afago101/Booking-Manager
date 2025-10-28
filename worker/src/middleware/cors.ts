// CORS middleware

import { Context, Next } from 'hono';
import { Env } from '../types';

export async function corsMiddleware(c: Context, next: Next): Promise<void> {
  const origin = c.req.header('origin');
  const env = c.env as Env;
  const allowedOrigins = env.CORS_ORIGINS?.split(',').map(o => o.trim()) || ['*'];

  // Handle preflight
  if (c.req.method === 'OPTIONS') {
    return c.text('', 204, {
      'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-admin-key',
      'Access-Control-Max-Age': '86400',
    });
  }

  await next();

  // Add CORS headers to response
  if (origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin))) {
    c.res.headers.set('Access-Control-Allow-Origin', origin);
    c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');
  }
}

