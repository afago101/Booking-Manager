// components/NotificationSettingsModal.tsx

import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

interface NotificationSettingsModalProps {
  onClose: () => void;
}

const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({ onClose }) => {
  const [emails, setEmails] = useState<string[]>(Array(5).fill(''));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchEmails = async () => {
      setIsLoading(true);
      try {
        const storedEmails = await apiService.getNotificationEmails();
        // Ensure there are always 5 elements
        const fullEmails = [...storedEmails, ...Array(5).fill('')].slice(0, 5);
        setEmails(fullEmails);
      } catch (err) {
        setError('無法載入 Email 設定。');
      } finally {
        setIsLoading(false);
      }
    };
    fetchEmails();
  }, []);

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');
    try {
      await apiService.updateNotificationEmails(emails);
      setSuccess('通知設定已成功儲存！');
      setTimeout(onClose, 1500);
    } catch (err) {
      setError('儲存失敗，請再試一次。');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold">新訂單 Email 通知設定</h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600">
              當有新訂單時，系統將會發送通知到以下信箱。留空則表示不啟用。
            </p>
            {isLoading ? (
              <div>讀取中...</div>
            ) : (
              emails.map((email, index) => (
                <div key={index}>
                  <label htmlFor={`email-${index}`} className="block text-sm font-medium text-gray-700">
                    通知信箱 {index + 1}
                  </label>
                  <input
                    type="email"
                    id={`email-${index}`}
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => handleEmailChange(index, e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>
              ))
            )}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm">{success}</p>}
          </div>
          <div className="p-4 bg-gray-50 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSaving || isLoading}
              className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-md hover:bg-brand-dark disabled:bg-gray-400"
            >
              {isSaving ? '儲存中...' : '儲存設定'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NotificationSettingsModal;
