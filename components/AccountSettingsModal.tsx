
// components/AccountSettingsModal.tsx

import React, { useState } from 'react';
import { apiService } from '../services/apiService';

interface AccountSettingsModalProps {
  onClose: () => void;
}

const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({ onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('新密碼與確認密碼不相符。');
      return;
    }
    if (newPassword.length < 6) {
      setError('新密碼長度至少需要6個字元。');
      return;
    }

    setIsSaving(true);
    try {
      await apiService.updateAdminPassword(currentPassword, newPassword);
      setSuccess('密碼已成功更新！');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(onClose, 2000); // Close modal after 2 seconds on success
    } catch (err) {
      setError((err as Error).message || '更新失敗，請再試一次。');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold">帳號設定</h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">目前密碼</label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">新密碼</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">確認新密碼</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
            </div>
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
              disabled={isSaving}
              className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-md hover:bg-brand-dark disabled:bg-gray-400"
            >
              {isSaving ? '儲存中...' : '儲存變更'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountSettingsModal;
