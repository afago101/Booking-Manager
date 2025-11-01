// components/AdminCustomerList.tsx - 後台會員管理

import React, { useState, useEffect } from 'react';
import { CustomerProfile, Booking, Coupon } from '../types';
import { apiService } from '../services/apiService';

const AdminCustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<{
    profile: CustomerProfile;
    bookings: Booking[];
    coupons: Coupon[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getCustomers();
      setCustomers(data);
    } catch (err: any) {
      console.error('Error loading customers:', err);
      setError(err.message || '載入會員資料失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCustomer = async (lineUserId: string) => {
    try {
      const data = await apiService.getCustomer(lineUserId);
      setSelectedCustomer(data);
    } catch (err: any) {
      console.error('Error loading customer details:', err);
      alert(err.message || '載入會員詳情失敗');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">載入中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadCustomers}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          重新載入
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">LINE 會員管理</h2>
        <button
          onClick={loadCustomers}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          重新整理
        </button>
      </div>

      {selectedCustomer ? (
        <div>
          <button
            onClick={() => setSelectedCustomer(null)}
            className="mb-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            ← 返回列表
          </button>

          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-4">會員資訊</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">姓名</p>
                  <p className="text-lg font-semibold">{selectedCustomer.profile.guestName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">電話</p>
                  <p className="text-lg font-semibold">{selectedCustomer.profile.contactPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">累計晚數</p>
                  <p className="text-lg font-semibold text-blue-600">{selectedCustomer.profile.totalNights} 晚</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">累計訂單</p>
                  <p className="text-lg font-semibold text-blue-600">{selectedCustomer.profile.totalBookings} 筆</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">LINE User ID</p>
                <p className="text-xs font-mono text-gray-500 break-all">{selectedCustomer.profile.lineUserId}</p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">訂單記錄 ({selectedCustomer.bookings.length})</h3>
              {selectedCustomer.bookings.length === 0 ? (
                <p className="text-gray-500">尚無訂單</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">訂單編號</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">入住日期</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">退房日期</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">金額</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">狀態</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedCustomer.bookings.map((booking) => (
                        <tr key={booking.id}>
                          <td className="px-4 py-3 text-sm font-mono">{booking.id}</td>
                          <td className="px-4 py-3 text-sm">{booking.checkInDate}</td>
                          <td className="px-4 py-3 text-sm">{booking.checkOutDate}</td>
                          <td className="px-4 py-3 text-sm">NT$ {booking.totalPrice.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded text-xs ${
                              booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {booking.status === 'confirmed' ? '已確認' :
                               booking.status === 'cancelled' ? '已取消' : '待確認'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">優惠券 ({selectedCustomer.coupons.length})</h3>
              {selectedCustomer.coupons.length === 0 ? (
                <p className="text-gray-500">尚無優惠券</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {selectedCustomer.coupons.map((coupon) => (
                    <div
                      key={coupon.id}
                      className={`p-4 rounded-lg border-2 ${
                        coupon.type === 'free_night'
                          ? 'bg-purple-50 border-purple-300'
                          : 'bg-green-50 border-green-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold">
                            {coupon.type === 'free_night' ? '10晚送1晚' : '住兩晚折300'}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">優惠碼：{coupon.couponCode}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          coupon.status === 'active' ? 'bg-green-100 text-green-800' :
                          coupon.status === 'used' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {coupon.status === 'active' ? '有效' :
                           coupon.status === 'used' ? '已使用' : '已過期'}
                        </span>
                      </div>
                      {coupon.expiresAt && (
                        <p className="text-xs text-gray-500">
                          到期日：{new Date(coupon.expiresAt).toLocaleDateString('zh-TW')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">姓名</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">電話</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">累計晚數</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">累計訂單</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    尚無會員資料
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.lineUserId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {customer.guestName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.contactPhone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="font-semibold text-blue-600">{customer.totalNights}</span> 晚
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="font-semibold text-blue-600">{customer.totalBookings}</span> 筆
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleViewCustomer(customer.lineUserId)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        查看詳情
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminCustomerList;


