// components/AdminCouponManagement.tsx - 後台優惠券管理

import React, { useState, useEffect } from 'react';
import { Coupon } from '../types';
import { apiService } from '../services/apiService';

const AdminCouponManagement: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    lineUserId: '',
    type: 'stay_discount' as 'stay_discount' | 'free_night',
    value: 300,
    minNights: 2,
    expiresAt: '',
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getCoupons();
      setCoupons(data);
    } catch (err: any) {
      console.error('Error loading coupons:', err);
      setError(err.message || '載入優惠券失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async () => {
    if (!newCoupon.lineUserId) {
      alert('請輸入 LINE User ID');
      return;
    }

    try {
      await apiService.createCoupon({
        lineUserId: newCoupon.lineUserId,
        type: newCoupon.type,
        value: newCoupon.value,
        minNights: newCoupon.minNights || undefined,
        expiresAt: newCoupon.expiresAt || undefined,
      });
      setIsCreateModalOpen(false);
      setNewCoupon({
        lineUserId: '',
        type: 'stay_discount',
        value: 300,
        minNights: 2,
        expiresAt: '',
      });
      await loadCoupons();
      alert('優惠券建立成功');
    } catch (err: any) {
      alert(err.message || '建立優惠券失敗');
    }
  };

  const handleUpdateCouponStatus = async (couponId: string, status: string) => {
    try {
      await apiService.updateCoupon(couponId, { status });
      await loadCoupons();
    } catch (err: any) {
      alert(err.message || '更新失敗');
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
          onClick={loadCoupons}
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
        <h2 className="text-2xl font-bold text-gray-800">優惠券管理</h2>
        <div className="flex gap-2">
          <button
            onClick={loadCoupons}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            重新整理
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            + 建立優惠券
          </button>
        </div>
      </div>

      {/* 建立優惠券 Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">建立優惠券</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LINE User ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCoupon.lineUserId}
                  onChange={(e) => setNewCoupon({ ...newCoupon, lineUserId: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="輸入 LINE User ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  優惠券類型
                </label>
                <select
                  value={newCoupon.type}
                  onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value as 'stay_discount' | 'free_night' })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="stay_discount">住兩晚折300</option>
                  <option value="free_night">10晚送1晚</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  優惠金額/晚數
                </label>
                <input
                  type="number"
                  value={newCoupon.value}
                  onChange={(e) => setNewCoupon({ ...newCoupon, value: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  最低晚數要求
                </label>
                <input
                  type="number"
                  value={newCoupon.minNights}
                  onChange={(e) => setNewCoupon({ ...newCoupon, minNights: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  到期日（選填）
                </label>
                <input
                  type="date"
                  value={newCoupon.expiresAt}
                  onChange={(e) => setNewCoupon({ ...newCoupon, expiresAt: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleCreateCoupon}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  建立
                </button>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 優惠券列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">優惠碼</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">類型</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">價值</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">狀態</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">到期日</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  尚無優惠券
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{coupon.couponCode}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {coupon.type === 'free_night' ? '10晚送1晚' : '住兩晚折300'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {coupon.type === 'free_night' ? `${coupon.value} 晚` : `NT$ ${coupon.value}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${
                      coupon.status === 'active' ? 'bg-green-100 text-green-800' :
                      coupon.status === 'used' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {coupon.status === 'active' ? '有效' :
                       coupon.status === 'used' ? '已使用' : '已過期'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString('zh-TW') : '無限期'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {coupon.status === 'active' && (
                      <button
                        onClick={() => handleUpdateCouponStatus(coupon.id, 'expired')}
                        className="text-red-600 hover:text-red-800"
                      >
                        設為過期
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCouponManagement;


