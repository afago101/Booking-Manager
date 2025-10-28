

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockClosedIcon } from '../components/icons';
import { apiService } from '../services/apiService';

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
}

const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const success = await apiService.login(password);
      if (success) {
        onLoginSuccess();
        navigate('/admin/dashboard');
      } else {
        setError('密碼錯誤，請再試一次。');
      }
    } catch (err) {
      setError('登入時發生錯誤，請稍後再試。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-brand-dark">管理員登入</h1>
          <p className="text-gray-500 mt-2">祝福海灣訂房管理系統</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-secondary focus:border-brand-secondary"
                placeholder="請輸入密碼"
              />
            </div>
          </div>
          
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-brand-primary hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors disabled:bg-gray-400"
            >
              {isSubmitting ? '登入中...' : '登入'}
            </button>
          </div>
        </form>
         <div className="text-center text-sm text-gray-500">
            <p>此為簡易密碼驗證。在正式環境中可整合 Cloudflare Access 以提升安全性。</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
