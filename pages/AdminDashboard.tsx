// pages/AdminDashboard.tsx

import React, { useState } from 'react';
import AdminBookingList from '../components/AdminBookingList';
import AdminCalendarView from '../components/AdminCalendarView';
import PriceSettingsModal from '../components/PriceSettingsModal';
import AccountSettingsModal from '../components/AccountSettingsModal';
import NotificationSettingsModal from '../components/NotificationSettingsModal';
import { ListBulletIcon, CalendarDaysIcon, CurrencyDollarIcon, ArrowLeftOnRectangleIcon, Cog6ToothIcon, EnvelopeIcon } from '../components/icons';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeView, setActiveView] = useState<'list' | 'calendar'>('list');
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  // dataVersion is used as a key to force re-mounting and re-fetching of data in child components.
  const [dataVersion, setDataVersion] = useState(0);

  const refreshData = () => {
    setDataVersion(v => v + 1);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-2xl font-bold text-brand-dark">管理後台</h1>
              <div className="flex items-center gap-2">
                 <button
                    onClick={() => setIsNotificationModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                 >
                    <EnvelopeIcon className="h-5 w-5 mr-2" />
                    通知設定
                 </button>
                 <button
                    onClick={() => setIsAccountModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                 >
                    <Cog6ToothIcon className="h-5 w-5 mr-2" />
                    帳號設定
                 </button>
                <button
                  onClick={onLogout}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                >
                  <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2" />
                  登出
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center bg-gray-200 rounded-lg p-1">
              <button
                onClick={() => setActiveView('list')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeView === 'list' ? 'bg-white text-brand-dark shadow' : 'text-gray-600 hover:bg-gray-300'}`}
              >
                <ListBulletIcon className="h-5 w-5 inline mr-1" />
                列表模式
              </button>
              <button
                onClick={() => setActiveView('calendar')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeView === 'calendar' ? 'bg-white text-brand-dark shadow' : 'text-gray-600 hover:bg-gray-300'}`}
              >
                <CalendarDaysIcon className="h-5 w-5 inline mr-1" />
                日曆模式
              </button>
            </div>
            <button
              onClick={() => setIsPriceModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-secondary hover:bg-brand-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary"
            >
              <CurrencyDollarIcon className="h-5 w-5 mr-2" />
              房價設定
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            {activeView === 'list' ? (
              <AdminBookingList key={dataVersion} onDataChange={refreshData} />
            ) : (
              <AdminCalendarView key={dataVersion} onDataChange={refreshData} />
            )}
          </div>
        </main>
      </div>
      
      {isPriceModalOpen && (
        <PriceSettingsModal onClose={() => setIsPriceModalOpen(false)} />
      )}
      {isAccountModalOpen && (
        <AccountSettingsModal onClose={() => setIsAccountModalOpen(false)} />
      )}
      {isNotificationModalOpen && (
        <NotificationSettingsModal onClose={() => setIsNotificationModalOpen(false)} />
      )}
    </>
  );
};

export default AdminDashboard;