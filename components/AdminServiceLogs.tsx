// components/AdminServiceLogs.tsx

import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

interface ServiceLog {
  id: string;
  timestamp: string;
  service: string;
  action: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  duration?: number;
  userId?: string;
  details?: any;
}

interface LogsSummary {
  total: number;
  byService: Record<string, number>;
  byStatus: Record<string, number>;
  recentErrors: ServiceLog[];
}

const AdminServiceLogs: React.FC = () => {
  const [logs, setLogs] = useState<ServiceLog[]>([]);
  const [summary, setSummary] = useState<LogsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterService, setFilterService] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [limit, setLimit] = useState<number>(50);

  useEffect(() => {
    loadLogs();
    loadSummary();
  }, [filterService, filterStatus, limit]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filterService) params.append('service', filterService);
      if (filterStatus) params.append('status', filterStatus);
      if (limit) params.append('limit', limit.toString());
      
      const response = await apiService.getServiceLogs(params.toString());
      setLogs(response.logs || []);
    } catch (err: any) {
      console.error('Error loading logs:', err);
      setError(err.message || '載入日誌失敗');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const response = await apiService.getServiceLogsSummary();
      setSummary(response);
    } catch (err: any) {
      console.error('Error loading summary:', err);
    }
  };

  const handleExport = async () => {
    try {
      const csv = await apiService.exportServiceLogs();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `service-logs-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error('Error exporting logs:', err);
      alert('匯出失敗：' + (err.message || 'Unknown error'));
    }
  };

  const handleClear = async () => {
    if (!confirm('確定要清除所有日誌嗎？此操作無法復原。')) {
      return;
    }
    
    try {
      await apiService.clearServiceLogs();
      loadLogs();
      loadSummary();
      alert('日誌已清除');
    } catch (err: any) {
      console.error('Error clearing logs:', err);
      alert('清除失敗：' + (err.message || 'Unknown error'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getServiceColor = (service: string) => {
    switch (service) {
      case 'line':
        return 'bg-blue-100 text-blue-800';
      case 'email':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    return `${ms}ms`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-TW');
  };

  return (
    <div className="space-y-4">
      {/* 標題與操作按鈕 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">服務監測日誌</h2>
          <p className="text-sm text-slate-600 mt-1">查看 LINE 和 Email 服務的操作日誌</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadLogs}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            重新載入
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            匯出 CSV
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            清除日誌
          </button>
        </div>
      </div>

      {/* 摘要統計 */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="text-sm text-gray-600">總日誌數</div>
            <div className="text-2xl font-bold text-gray-800">{summary.total}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="text-sm text-gray-600">LINE 服務</div>
            <div className="text-2xl font-bold text-blue-600">{summary.byService.line || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="text-sm text-gray-600">Email 服務</div>
            <div className="text-2xl font-bold text-purple-600">{summary.byService.email || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="text-sm text-gray-600">錯誤數量</div>
            <div className="text-2xl font-bold text-red-600">{summary.byStatus.error || 0}</div>
          </div>
        </div>
      )}

      {/* 篩選器 */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">服務</label>
            <select
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">全部</option>
              <option value="line">LINE</option>
              <option value="email">Email</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">狀態</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">全部</option>
              <option value="success">成功</option>
              <option value="error">錯誤</option>
              <option value="warning">警告</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">顯示數量</label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="20">20 筆</option>
              <option value="50">50 筆</option>
              <option value="100">100 筆</option>
              <option value="200">200 筆</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadLogs}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              套用篩選
            </button>
          </div>
        </div>
      </div>

      {/* 錯誤訊息 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* 日誌列表 */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">載入中...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          沒有日誌記錄
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">時間</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">服務</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">狀態</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">訊息</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">執行時間</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">使用者</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getServiceColor(log.service)}`}>
                        {log.service}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{log.action}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                        {log.status === 'success' ? '成功' : log.status === 'error' ? '錯誤' : '警告'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="max-w-md truncate" title={log.message}>
                        {log.message}
                      </div>
                      {log.details && (
                        <details className="mt-1">
                          <summary className="text-xs text-blue-600 cursor-pointer">詳細資訊</summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDuration(log.duration)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {log.userId ? (
                        <span className="max-w-xs truncate block" title={log.userId}>
                          {log.userId}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminServiceLogs;

