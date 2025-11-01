// pages/BenefitsPage.tsx - 常客優惠頁面

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Coupon, CustomerProfile } from '../types';
import { apiService } from '../services/apiService';
import { getLineProfile, isInLine, initLineLogin } from '../utils/lineLogin';
import HeaderMenu from '../components/HeaderMenu';

const BenefitsPage: React.FC = () => {
  const navigate = useNavigate();
  const [lineUserId, setLineUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 嘗試從 LINE 取得 UID
      let userId: string | null = null;
      
      // 檢查是否在 LINE 環境中
      if (isInLine()) {
        try {
          await initLineLogin();
          const lineUser = await getLineProfile();
          if (lineUser) {
            userId = lineUser.lineUserId;
          }
        } catch (err) {
          console.error('Error getting LINE profile:', err);
        }
      }

      // 如果沒有 LINE UID，從 localStorage 讀取（如果有）
      if (!userId) {
        userId = localStorage.getItem('lineUserId');
      }

      if (!userId) {
        setError('請先綁定 LINE 帳號');
        setLoading(false);
        return;
      }

      setLineUserId(userId);

      // 取得客戶資料和優惠券
      const [customerProfile, customerCoupons] = await Promise.all([
        apiService.getCustomerProfile(userId).catch(() => null),
        apiService.getCustomerCoupons(userId).catch(() => []),
      ]);

      setProfile(customerProfile);
      setCoupons(customerCoupons.filter(c => {
        if (c.status !== 'active') return false;
        if (c.expiresAt && new Date(c.expiresAt) < new Date()) return false;
        return true;
      }));

    } catch (err: any) {
      console.error('Error loading benefits:', err);
      setError(err.message || '載入資料失敗');
    } finally {
      setLoading(false);
    }
  };

  const formatCouponType = (type: string) => {
    if (type === 'free_night') return '10晚送1晚住宿券';
    if (type === 'stay_discount') return '住兩晚折300元';
    return type;
  };

  const formatCouponDescription = (coupon: Coupon) => {
    if (coupon.type === 'free_night') {
      return `連續住宿${coupon.minNights || 2}晚以上可使用，免費住宿最便宜的1晚`;
    }
    if (coupon.type === 'stay_discount') {
      return `連續住宿${coupon.minNights || 2}晚以上可使用，折抵 NT$ ${coupon.value}`;
    }
    return '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderMenu />
        <div className="max-w-4xl mx-auto px-4 py-10 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">載入中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !lineUserId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderMenu />
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">尚未綁定 LINE 帳號</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              前往訂房頁面綁定
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-amber-50">
      <HeaderMenu />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">常客優惠</h1>
          <div className="w-20 h-1 bg-gradient-to-r from-amber-400 to-amber-600 mx-auto rounded-full"></div>
        </div>

        {/* 客戶資訊卡片 */}
        {profile && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">我的會員資訊</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">累計住宿晚數</p>
                <p className="text-2xl font-bold text-blue-600">{profile.totalNights} 晚</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">累計訂單數</p>
                <p className="text-2xl font-bold text-blue-600">{profile.totalBookings} 筆</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">姓名</p>
                <p className="text-lg font-semibold text-gray-800">{profile.guestName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">電話</p>
                <p className="text-lg font-semibold text-gray-800">{profile.contactPhone}</p>
              </div>
            </div>

            {/* 進度條：顯示距離下一張10晚送1晚還差幾晚 */}
            {profile.totalNights < 10 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 mb-2">
                  再住宿 <strong>{10 - profile.totalNights} 晚</strong> 即可獲得「10晚送1晚住宿券」！
                </p>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(profile.totalNights / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 優惠券列表 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">我的優惠券</h2>
            <Link
              to="/"
              className="text-blue-600 hover:text-blue-800 underline text-sm"
            >
              立即訂房使用 →
            </Link>
          </div>

          {coupons.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">目前沒有可用的優惠券</p>
              <Link
                to="/"
                className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                前往訂房以獲得優惠券
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className={`p-5 rounded-lg border-2 ${
                    coupon.type === 'free_night'
                      ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300'
                      : 'bg-gradient-to-br from-green-50 to-green-100 border-green-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">
                        {formatCouponType(coupon.type)}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatCouponDescription(coupon)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">優惠碼</div>
                      <div className="font-mono font-bold text-sm bg-white px-2 py-1 rounded border">
                        {coupon.couponCode}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">使用期限</span>
                      <span className="font-semibold text-gray-800">
                        {coupon.expiresAt
                          ? new Date(coupon.expiresAt).toLocaleDateString('zh-TW')
                          : '無限期'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      navigate('/', { state: { couponCode: coupon.couponCode } });
                    }}
                    className="mt-4 w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  >
                    立即使用
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 優惠說明 */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">優惠說明</h3>
          <div className="space-y-3 text-gray-700">
            <div className="flex items-start">
              <span className="text-2xl mr-3">🎁</span>
              <div>
                <p className="font-semibold">10晚送1晚住宿券</p>
                <p className="text-sm text-gray-600">
                  累計住宿10晚後自動獲得，需連續住宿2晚以上方可使用，免費住宿最便宜的1晚
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">💰</span>
              <div>
                <p className="font-semibold">住兩晚折300元</p>
                <p className="text-sm text-gray-600">
                  每次連續住宿2晚以上即可獲得，下次訂房可使用，折抵 NT$ 300
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BenefitsPage;


