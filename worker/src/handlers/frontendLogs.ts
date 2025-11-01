// Frontend logs API handler
// Receives logs from frontend and stores them in service logger

import { Context } from 'hono';
import { serviceLogger } from '../utils/logger';
import { errorResponse } from '../utils/helpers';

/**
 * 接收前端日誌（不需要 admin 權限，但會記錄來源）
 * POST /api/admin/logs/frontend
 */
export async function handleReceiveFrontendLogs(c: Context): Promise<Response> {
  try {
    const body = await c.req.json();
    const { logs } = body;

    if (!Array.isArray(logs)) {
      return errorResponse('Invalid request body. Expected array of logs', 'BAD_REQUEST', 400);
    }

    // Process each log from frontend
    for (const log of logs) {
      serviceLogger.log({
        service: log.service || 'frontend',
        action: log.action || 'unknown',
        status: log.status || 'info',
        message: log.message || '',
        details: {
          ...log.details,
          userAgent: log.userAgent,
          url: log.url,
        },
        userId: log.userId,
        userAgent: log.userAgent,
        url: log.url,
      });
    }

    return c.json({
      success: true,
      received: logs.length,
    });
  } catch (error: any) {
    console.error('Error receiving frontend logs:', error);
    return errorResponse(error.message || 'Failed to receive frontend logs', 'INTERNAL_ERROR', 500);
  }
}

