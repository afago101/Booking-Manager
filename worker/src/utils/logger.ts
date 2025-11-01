// Service monitoring and logging utility

export interface ServiceLog {
  id: string;
  timestamp: string;
  service: string; // 'line', 'email', 'sheets', 'frontend', etc.
  action: string; // 'oauth', 'verify', 'send', 'liff_init', etc.
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: any; // Additional details (error info, response data, etc.)
  duration?: number; // Response time in ms
  userId?: string; // LINE User ID or email
  userAgent?: string; // Browser user agent (from frontend logs)
  url?: string; // Page URL (from frontend logs)
}

export class ServiceLogger {
  private logs: ServiceLog[] = [];
  private maxLogs = 200; // Keep last 200 logs in memory

  /**
   * Log a service event
   */
  log(log: Omit<ServiceLog, 'id' | 'timestamp'>): void {
    const fullLog: ServiceLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...log,
    };

    // Add to logs array
    this.logs.unshift(fullLog); // Add to beginning

    // Keep only last maxLogs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Also log to console for debugging
    const logLevel = log.status === 'error' ? 'error' : log.status === 'warning' ? 'warn' : log.status === 'info' ? 'info' : 'log';
    console[logLevel](`[${log.service.toUpperCase()}] ${log.action}:`, {
      status: log.status,
      message: log.message,
      ...(log.details && { details: log.details }),
      ...(log.duration && { duration: `${log.duration}ms` }),
      ...(log.userId && { userId: log.userId }),
      ...(log.userAgent && { userAgent: log.userAgent }),
      ...(log.url && { url: log.url }),
    });
  }

  /**
   * Get logs filtered by service, status, or time range
   */
  getLogs(options?: {
    service?: string;
    status?: 'success' | 'error' | 'warning' | 'info';
    limit?: number;
    since?: string; // ISO timestamp
  }): ServiceLog[] {
    let filtered = [...this.logs];

    if (options?.service) {
      filtered = filtered.filter(log => log.service === options.service);
    }

    if (options?.status) {
      filtered = filtered.filter(log => log.status === options.status);
    }

    if (options?.since) {
      const sinceTime = new Date(options.since).getTime();
      filtered = filtered.filter(log => new Date(log.timestamp).getTime() >= sinceTime);
    }

    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  /**
   * Get logs summary (counts by service and status)
   */
  getSummary(): {
    total: number;
    byService: Record<string, number>;
    byStatus: Record<string, number>;
    recentErrors: ServiceLog[];
  } {
    const summary = {
      total: this.logs.length,
      byService: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      recentErrors: this.logs.filter(log => log.status === 'error').slice(0, 10),
    };

    this.logs.forEach(log => {
      summary.byService[log.service] = (summary.byService[log.service] || 0) + 1;
      summary.byStatus[log.status] = (summary.byStatus[log.status] || 0) + 1;
    });

    return summary;
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Get all logs (for export)
   */
  getAllLogs(): ServiceLog[] {
    return [...this.logs];
  }
}

// Global logger instance
export const serviceLogger = new ServiceLogger();

