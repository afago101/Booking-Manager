// pages/ConfirmationPage.tsx

import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Booking } from '../types';
import { generateICSFile } from '../utils/fileGenerators';
import { CheckCircleIcon, CalendarDaysIcon } from '../components/icons';
import { useLanguage, useTranslations } from '../contexts/LanguageContext';
import { apiService } from '../services/apiService';
import { loginWithLine, getLineProfile, isInLine } from '../utils/lineLogin';

interface ConfirmationPageProps {
  booking: Booking | null;
}

const ConfirmationPage: React.FC<ConfirmationPageProps> = ({ booking }) => {
  const t = useTranslations();
  const { lang } = useLanguage();
  const [isBinding, setIsBinding] = useState(false);
  const [bindingSuccess, setBindingSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!booking) {
    return <Navigate to="/" replace />;
  }

  const {
    id,
    guestName,
    checkInDate,
    checkOutDate,
    numberOfGuests,
    totalPrice,
    contactPhone,
    email,
    lineName,
    lineUserId,
  } = booking;

  const handleBindLine = async () => {
    try {
      setIsBinding(true);
      setError(null);

      // 如果在 LINE 環境中，直接取得 profile
      let lineUserInfo = null;
      if (isInLine()) {
        lineUserInfo = await getLineProfile();
      }

      // 如果不在 LINE 環境或未登入，打開 LINE 登入
      if (!lineUserInfo) {
        await loginWithLine();
        // 登入後會重新導向，所以這裡不需要繼續
        return;
      }

      // 綁定訂單
      const bindResult = await apiService.bindBooking(id, lineUserInfo.lineUserId, guestName, contactPhone, email);
      
      // 確保客戶資料已同步（雙重保險）
      try {
        await apiService.syncCustomerProfile(
          lineUserInfo.lineUserId,
          lineUserInfo.name,
          lineUserInfo.picture,
          guestName,
          contactPhone,
          email
        );
      } catch (syncErr) {
        console.warn('Additional sync failed, but bind succeeded:', syncErr);
      }
      
      // 設定成功狀態
      setBindingSuccess(true);
      
      // 顯示成功訊息（包含客戶資料）
      console.log('綁定成功，客戶資料已同步到 Sheets:', bindResult.profile);
    } catch (err: any) {
      console.error('Error binding LINE:', err);
      setError(err.message || '綁定失敗，請稍後再試');
    } finally {
      setIsBinding(false);
    }
  };

  // 檢查 URL 參數（LINE OAuth 登入後會帶回 code）
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    console.log('[ConfirmationPage] OAuth callback check:', { 
      hasCode: !!code, 
      hasState: !!state,
      hasLineUserId: !!lineUserId,
      bindingSuccess,
      isBinding,
      currentUrl: window.location.href,
    });
    
    if (code && state && !lineUserId && !bindingSuccess && !isBinding) {
      console.log('[ConfirmationPage] Processing OAuth callback for booking binding...');
      setIsBinding(true);
      
      // 處理 OAuth callback
      import('../utils/lineLogin').then(({ handleLineOAuthCallback }) => {
        console.log('[ConfirmationPage] handleLineOAuthCallback imported, calling...');
        return handleLineOAuthCallback();
      }).then(async (token) => {
        console.log('[ConfirmationPage] Callback completed, token:', !!token);
        
        if (token) {
          try {
            console.log('[ConfirmationPage] Verifying token...');
            // 驗證 token 並取得 LINE User ID
            const result = await apiService.verifyLineToken(token);
            console.log('[ConfirmationPage] Token verified, LINE User ID:', result.lineUserId);
            
            console.log('[ConfirmationPage] Binding booking...');
            // 綁定訂單
            const bindResult = await apiService.bindBooking(id, result.lineUserId, guestName, contactPhone, email);
            
            // 確保客戶資料已同步（雙重保險）
            try {
              console.log('[ConfirmationPage] Syncing customer profile...');
              await apiService.syncCustomerProfile(
                result.lineUserId,
                result.name,
                result.picture,
                guestName,
                contactPhone,
                email
              );
            } catch (syncErr) {
              console.warn('[ConfirmationPage] Additional sync failed, but bind succeeded:', syncErr);
            }
            
            // 設定成功狀態
            setBindingSuccess(true);
            setIsBinding(false);
            
            // 顯示成功訊息（包含客戶資料）
            console.log('[ConfirmationPage] 綁定成功，客戶資料已同步到 Sheets:', bindResult.profile);
            
            // URL 參數已在 handleLineOAuthCallback 中清除並恢復到原路徑
          } catch (bindErr: any) {
            console.error('[ConfirmationPage] Error binding booking:', bindErr);
            setError(bindErr.message || '綁定失敗，請稍後再試');
            setIsBinding(false);
          }
        } else {
          console.warn('[ConfirmationPage] OAuth callback returned null token');
          setError('綁定失敗，請稍後再試');
          setIsBinding(false);
        }
      }).catch((err) => {
        console.error('[ConfirmationPage] Error handling OAuth callback:', err);
        setError('綁定失敗，請稍後再試');
        setIsBinding(false);
      });
    }
  }, [id, guestName, contactPhone, email, lineUserId, bindingSuccess, isBinding]);

  const nights = (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 3600 * 24);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-lg shadow-lg p-8 space-y-6">
        <div className="text-center">
          <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
          <h1 className="text-3xl font-bold text-brand-dark mt-4">{t.confirmationPage.title}</h1>
          <p className="text-gray-500 mt-2 text-base">{t.confirmationPage.subtitle}</p>
        </div>

        <div className="border-t border-b border-gray-200 divide-y divide-gray-200">
          <div className="py-4 flex justify-between">
            <span className="font-medium text-gray-600 text-base">{t.confirmationPage.guestName}</span>
            <span className="text-gray-800 text-base">{guestName}</span>
          </div>
          <div className="py-4 flex justify-between">
            <span className="font-medium text-gray-600 text-base">{t.confirmationPage.contactPhone}</span>
            <span className="text-gray-800 text-base">{contactPhone}</span>
          </div>
          <div className="py-4 flex justify-between">
            <span className="font-medium text-gray-600 text-base">{t.confirmationPage.email}</span>
            <span className="text-gray-800 text-base">{email}</span>
          </div>
          <div className="py-4 flex justify-between">
            <span className="font-medium text-gray-600 text-base">{t.confirmationPage.lineName}</span>
            <span className="text-gray-800 text-base">{lineName}</span>
          </div>
          <div className="py-4 flex justify-between">
            <span className="font-medium text-gray-600 text-base">{t.confirmationPage.checkInDate}</span>
            <span className="text-gray-800 text-base">{checkInDate}</span>
          </div>
           <div className="py-4 flex justify-between">
            <span className="font-medium text-gray-600 text-base">{t.confirmationPage.checkOutDate}</span>
            <span className="text-gray-800 text-base">{checkOutDate}</span>
          </div>
           <div className="py-4 flex justify-between">
            <span className="font-medium text-gray-600 text-base">{t.confirmationPage.nights}</span>
            <span className="text-gray-800 text-base">{nights} {t.confirmationPage.nightsSuffix}</span>
          </div>
          <div className="py-4 flex justify-between">
            <span className="font-medium text-gray-600 text-base">{t.confirmationPage.guests}</span>
            <span className="text-gray-800 text-base">{numberOfGuests} {t.confirmationPage.guestsSuffix}</span>
          </div>
        </div>
        
        <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800">
          <h3 className="font-bold text-lg">{t.confirmationPage.paymentInfo.title}</h3>
          <p className="text-base">{t.confirmationPage.paymentInfo.bankName}</p>
          <p className="text-base">{t.confirmationPage.paymentInfo.accountNumber}</p>
          <p className="text-base mt-2">{t.confirmationPage.paymentInfo.instructions}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <span className="text-gray-600 text-lg">{t.confirmationPage.totalPrice}:</span>
          <span className="text-3xl font-bold text-brand-primary ml-2">{totalPrice.toLocaleString()} {t.confirmationPage.currency}</span>
        </div>

        {/* LINE 綁定區域 */}
        {!lineUserId && !bindingSuccess && (
          <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
            <h3 className="font-bold text-lg text-blue-800 mb-2">綁定 LINE 以享常客優惠</h3>
            <p className="text-sm text-blue-700 mb-3">
              綁定 LINE 後可獲得專屬優惠券，每10晚送1晚住宿券，住兩晚折300元！
            </p>
            {error && (
              <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                {error}
              </div>
            )}
            <button
              onClick={handleBindLine}
              disabled={isBinding}
              className="w-full flex items-center justify-center py-2 px-4 bg-green-500 text-white rounded-md shadow-sm text-md font-medium hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBinding ? '綁定中...' : '綁定 LINE 帳號'}
            </button>
          </div>
        )}

        {bindingSuccess && (
          <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg shadow-sm">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-green-900 font-bold text-xl mb-1">✅ LINE 帳號已成功綁定！</h3>
                <p className="text-sm text-green-800 font-medium mb-2">
                  會員資料已同步建立完成
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-md p-4 mb-4 border border-green-200">
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

            <div className="flex flex-col sm:flex-row gap-3">
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
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => generateICSFile(booking, t)}
            className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-md font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary transition-colors"
          >
            <CalendarDaysIcon className="h-5 w-5 mr-2" />
            {t.buttons.addToCalendar}
          </button>
          <Link
            to="/"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-md font-medium text-white bg-brand-primary hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors"
          >
            {lang === 'zh' ? '返回首頁' : 'Back to Home'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPage;