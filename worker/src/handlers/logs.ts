// Service logs API handlers

import { Context } from 'hono';
import { serviceLogger } from '../utils/logger';
import { errorResponse } from '../utils/helpers';

/**
 * 取得服務日誌（需要 admin 權限）
 * GET /api/admin/logs
 */
export async function handleGetLogs(c: Context): Promise<Response> {
  try {
    const service = c.req.query('service'); // 'line', 'email', etc.
    const status = c.req.query('status') as 'success' | 'error' | 'warning' | undefined;
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : undefined;
    const since = c.req.query('since'); // ISO timestamp

    const logs = serviceLogger.getLogs({
      service,
      status,
      limit,
      since,
    });

    return c.json({
      logs,
      total: logs.length,
    });
  } catch (error: any) {
    console.error('Error getting logs:', error);
    return errorResponse(error.message || 'Failed to get logs', 'INTERNAL_ERROR', 500);
  }
}

/**
 * 取得服務日誌摘要
 * GET /api/admin/logs/summary
 */
export async function handleGetLogsSummary(c: Context): Promise<Response> {
  try {
    const summary = serviceLogger.getSummary();
    return c.json(summary);
  } catch (error: any) {
    console.error('Error getting logs summary:', error);
    return errorResponse(error.message || 'Failed to get logs summary', 'INTERNAL_ERROR', 500);
  }
}

/**
 * 匯出所有日誌
 * GET /api/admin/logs/export
 */
export async function handleExportLogs(c: Context): Promise<Response> {
  try {
    const logs = serviceLogger.getAllLogs();
    
    // 返回 CSV 格式
    const csv = [
      // Header
      'id,timestamp,service,action,status,message,duration,userId,details',
      // Rows
      ...logs.map(log => {
        const details = log.details ? JSON.stringify(log.details).replace(/"/g, '""') : '';
        return [
          log.id,
          log.timestamp,
          log.service,
          log.action,
          log.status,
          log.message.replace(/"/g, '""'),
          log.duration || '',
          log.userId || '',
          `"${details}"`,
        ].join(',');
      }),
    ].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="service-logs.csv"',
      },
    });
  } catch (error: any) {
    console.error('Error exporting logs:', error);
    return errorResponse(error.message || 'Failed to export logs', 'INTERNAL_ERROR', 500);
  }
}

/**
 * 清除所有日誌
 * DELETE /api/admin/logs
 */
export async function handleClearLogs(c: Context): Promise<Response> {
  try {
    serviceLogger.clear();
    return c.json({ message: 'Logs cleared successfully' });
  } catch (error: any) {
    console.error('Error clearing logs:', error);
    return errorResponse(error.message || 'Failed to clear logs', 'INTERNAL_ERROR', 500);
  }
}

