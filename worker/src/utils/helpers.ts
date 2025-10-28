// Helper utilities

import { Booking } from '../types';

export function generateId(prefix: string = 'booking'): string {
  // Simple nanoid-like implementation for edge runtime
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 11);
  return `${prefix}_${timestamp}${randomPart}`;
}

export function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00.000Z');
}

export function formatDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDatesInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = parseDate(startDate);
  const end = parseDate(endDate);

  while (current < end) {
    dates.push(formatDate(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

export function calculateNights(checkIn: string, checkOut: string): number {
  const dates = getDatesInRange(checkIn, checkOut);
  return dates.length;
}

export function isWeekend(dateStr: string): boolean {
  const date = parseDate(dateStr);
  const day = date.getUTCDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

export function validateDateFormat(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

export function validatePhoneNumber(phone: string): boolean {
  // Basic validation - adjust based on your requirements
  const regex = /^[\d\s\-\+\(\)]{8,20}$/;
  return regex.test(phone);
}

export function corsHeaders(origin: string | null, allowedOrigins: string[]): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin))) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, x-admin-key';
    headers['Access-Control-Max-Age'] = '86400';
  }

  return headers;
}

export function errorResponse(
  message: string,
  code: string,
  status: number,
  headers?: HeadersInit
): Response {
  return new Response(
    JSON.stringify({ error: message, code }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }
  );
}

export function successResponse(data: any, headers?: HeadersInit): Response {
  return new Response(
    JSON.stringify(data),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }
  );
}

// Simple in-memory rate limiter
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  identifier: string,
  limit: number = 60,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || record.resetAt < now) {
    rateLimitStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

// Clean up old rate limit records periodically
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

