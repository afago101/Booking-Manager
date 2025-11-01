// Frontend logging service - sends logs to backend for monitoring
// This allows monitoring LINE login logs from mobile devices

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface FrontendLog {
  service: string; // 'line', 'frontend', etc.
  action: string; // 'liff_init', 'oauth_callback', 'profile_load', etc.
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: any;
  userId?: string; // LINE User ID
  userAgent?: string;
  url?: string;
}

class FrontendLogger {
  private logQueue: FrontendLog[] = [];
  private isSending = false;
  private batchSize = 5; // Send logs in batches of 5
  private sendInterval = 2000; // Send every 2 seconds
  private maxRetries = 3;

  constructor() {
    // Periodically send queued logs
    setInterval(() => {
      this.flushLogs();
    }, this.sendInterval);

    // Send logs before page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flushLogs(true);
      });
    }
  }

  /**
   * Log a frontend event
   */
  log(log: FrontendLog): void {
    // Add browser context
    const enrichedLog: FrontendLog = {
      ...log,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Add to queue
    this.logQueue.push(enrichedLog);

    // Also log to console for debugging (only in development)
    if (import.meta.env.DEV) {
      const logLevel = log.status === 'error' ? 'error' : log.status === 'warning' ? 'warn' : 'info';
      console[logLevel](`[FrontendLog] [${log.service}] ${log.action}:`, {
        status: log.status,
        message: log.message,
        ...(log.details && { details: log.details }),
        ...(log.userId && { userId: log.userId }),
      });
    }

    // If queue is getting large, send immediately
    if (this.logQueue.length >= this.batchSize) {
      this.flushLogs();
    }
  }

  /**
   * Send queued logs to backend
   */
  private async flushLogs(sync = false): Promise<void> {
    if (this.isSending || this.logQueue.length === 0) {
      return;
    }

    this.isSending = true;

    try {
      // Take logs from queue
      const logsToSend = this.logQueue.splice(0, this.batchSize);

      // Send to backend
      const response = await fetch(`${API_BASE_URL}/admin/logs/frontend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: logsToSend }),
        // If sync is true, don't use keepalive (for beforeunload)
        keepalive: !sync,
      });

      if (!response.ok) {
        // If failed, put logs back in queue (except for sync mode)
        if (!sync && logsToSend.length <= this.maxRetries) {
          this.logQueue.unshift(...logsToSend);
        }
      }
    } catch (error) {
      // Network error - put logs back in queue (except for sync mode)
      if (!sync) {
        const logsToSend = this.logQueue.splice(0, this.batchSize);
        // Only retry if queue hasn't grown too large
        if (this.logQueue.length < 50) {
          this.logQueue.unshift(...logsToSend);
        }
      }
      // Silently fail - don't spam console with errors
    } finally {
      this.isSending = false;
    }
  }

  /**
   * Force flush logs immediately (for critical events)
   */
  async flush(): Promise<void> {
    await this.flushLogs(true);
  }
}

// Global logger instance
export const frontendLogger = new FrontendLogger();

