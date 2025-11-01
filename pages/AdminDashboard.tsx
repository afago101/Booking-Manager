// pages/AdminDashboard.tsx

import React, { useState } from 'react';
import AdminBookingList from '../components/AdminBookingList';
import AdminCalendarView from '../components/AdminCalendarView';
import AdminCustomerList from '../components/AdminCustomerList';
import AdminCouponManagement from '../components/AdminCouponManagement';
import PriceSettingsModal from '../components/PriceSettingsModal';
import AccountSettingsModal from '../components/AccountSettingsModal';
import NotificationSettingsModal from '../components/NotificationSettingsModal';
import AdminServiceLogs from '../components/AdminServiceLogs';
import { ListBulletIcon, CalendarDaysIcon, CurrencyDollarIcon, ArrowLeftOnRectangleIcon, Cog6ToothIcon, EnvelopeIcon, UsersIcon, TicketIcon, DocumentTextIcon } from '../components/icons';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'customers' | 'coupons' | 'logs'>('bookings');
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
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-amber-50">
        <header className="bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-2xl font-bold">管理後台</h1>
              <div className="flex items-center gap-2">
                 <button
                    onClick={() => setIsNotificationModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-slate-800 bg-white hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400"
                 >
                    <EnvelopeIcon className="h-5 w-5 mr-2" />
                    通知設定
                 </button>
                 <button
                    onClick={() => setIsAccountModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-slate-800 bg-white hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400"
                 >
                    <Cog6ToothIcon className="h-5 w-5 mr-2" />
                    帳號設定
                 </button>
                <button
                  onClick={onLogout}
                  className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-md text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-300"
                >
                  <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2" />
                  登出
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 標籤導航 */}
          <div className="mb-6">
            <div className="flex items-center bg-white/70 backdrop-blur rounded-lg p-1 shadow border border-amber-100">
              <button
                onClick={() => setActiveTab('bookings')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'bookings' ? 'bg-white text-slate-800 shadow' : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <ListBulletIcon className="h-5 w-5 inline mr-1" />
                訂單管理
              </button>
              <button
                onClick={() => setActiveTab('customers')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'customers' ? 'bg-white text-slate-800 shadow' : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <UsersIcon className="h-5 w-5 inline mr-1" />
                會員管理
              </button>
              <button
                onClick={() => setActiveTab('coupons')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'coupons' ? 'bg-white text-slate-800 shadow' : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <TicketIcon className="h-5 w-5 inline mr-1" />
                優惠券管理
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'logs' ? 'bg-white text-slate-800 shadow' : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <DocumentTextIcon className="h-5 w-5 inline mr-1" />
                服務日誌
              </button>
            </div>
          </div>

          {/* 訂單管理 */}
          {activeTab === 'bookings' && (
            <>
              <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center bg-white/70 backdrop-blur rounded-lg p-1 shadow border border-amber-100">
                  <button
                    onClick={() => setActiveView('list')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeView === 'list' ? 'bg-white text-slate-800 shadow' : 'text-slate-600 hover:bg-slate-200/70'}`}
                  >
                    <ListBulletIcon className="h-5 w-5 inline mr-1" />
                    列表模式
                  </button>
                  <button
                    onClick={() => setActiveView('calendar')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeView === 'calendar' ? 'bg-white text-slate-800 shadow' : 'text-slate-600 hover:bg-slate-200/70'}`}
                  >
                    <CalendarDaysIcon className="h-5 w-5 inline mr-1" />
                    日曆模式
                  </button>
                </div>
                <button
                  onClick={() => setIsPriceModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-md text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-300"
                >
                  <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                  房價設定
                </button>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-xl border border-amber-100">
                {activeView === 'list' ? (
                  <AdminBookingList key={dataVersion} onDataChange={refreshData} />
                ) : (
                  <AdminCalendarView key={dataVersion} onDataChange={refreshData} />
                )}
              </div>
            </>
          )}

          {/* 會員管理 */}
          {activeTab === 'customers' && (
            <div className="bg-white p-6 rounded-xl shadow-xl border border-amber-100">
              <AdminCustomerList />
            </div>
          )}

          {/* 優惠券管理 */}
          {activeTab === 'coupons' && (
            <div className="bg-white p-6 rounded-xl shadow-xl border border-amber-100">
              <AdminCouponManagement />
            </div>
          )}

          {/* 服務日誌 */}
          {activeTab === 'logs' && (
            <div className="bg-white p-6 rounded-xl shadow-xl border border-amber-100">
              <AdminServiceLogs />
            </div>
          )}
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