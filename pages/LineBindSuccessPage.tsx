// pages/LineBindSuccessPage.tsx - LINE 綁定成功頁面

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import HeaderMenu from '../components/HeaderMenu';
import { useTranslations } from '../contexts/LanguageContext';

const LineBindSuccessPage: React.FC = () => {
  const t = useTranslations();
  const location = useLocation();
  const bookingId = location.state?.bookingId;
  const lineUserName = location.state?.lineUserName;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-amber-50">
      <HeaderMenu />
      <div className="max-w-2xl mx-auto px-4 py-10 md:py-16">
        <div className="bg-white rounded-xl shadow-xl p-6 md:p-8 space-y-6 border border-amber-100">
          {/* 成功圖示 */}
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              ✅ LINE 帳號綁定成功！
            </h1>
            <div className="w-20 h-1 bg-gradient-to-r from-green-400 to-green-600 mx-auto mt-4 rounded-full"></div>
          </div>

          {/* 成功訊息 */}
          <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg">
            <div className="space-y-3">
              <p className="text-green-900 font-semibold text-lg">
                🎉 恭喜！您的 LINE 帳號已成功綁定
              </p>
              {lineUserName && (
                <p className="text-green-800">
                  LINE 名稱：<strong>{lineUserName}</strong>
                </p>
              )}
              <p className="text-sm text-green-700">
                會員資料已同步建立完成，現在您可以享受所有常客優惠！
              </p>
            </div>
          </div>

          {/* 優惠說明 */}
          <div className="bg-white rounded-md p-5 border border-green-200">
            <h4 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              現在可享受以下常客優惠：
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span><strong className="text-green-700">住兩晚折 300 元</strong>：每筆訂房住兩晚以上即可獲得此優惠券</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span><strong className="text-green-700">10 晚送 1 晚住宿券</strong>：累計住宿達到 10 晚即可獲得免費住宿一晚</span>
              </li>
              <li className="flex items-start gap-2 pt-2 border-t border-green-100">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-600">所有優惠券將自動發放到您的帳號，可在「我的優惠券」頁面查看</span>
              </li>
            </ul>
          </div>

          {/* 操作按鈕 */}
          <div className="flex flex-col sm:flex-row gap-3">
            {bookingId && (
              <Link
                to="/confirmation"
                state={{ bookingId }}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md font-medium text-base"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                返回訂單確認頁
              </Link>
            )}
            <Link
              to="/benefits"
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md font-medium text-base"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              查看我的優惠券
            </Link>
            <Link
              to="/booking"
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50 transition-all font-medium text-base"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              繼續訂房
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LineBindSuccessPage;

