// pages/BookingPage.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Booking, DailyPrices, BookingFormData, Coupon } from '../types';
import { apiService } from '../services/apiService';
import BookingPriceCalendar from '../components/BookingPriceCalendar';
import HeaderMenu from '../components/HeaderMenu';
import { useTranslations } from '../contexts/LanguageContext';
import { getLineProfile, isInLine, initLineLogin } from '../utils/lineLogin';
import { frontendLogger } from '../utils/frontendLogger';

interface BookingPageProps {
  setLastBooking: (booking: Booking) => void;
}

const initialFormData: BookingFormData = {
  guestName: '',
  contactPhone: '',
  email: '',
  lineName: '',
  numberOfGuests: 1,
  useCoupon: 'no',
  arrivalTime: '',
};

const initialPolicyState = {
  policy1: false,
  policy2: false,
  policy3: false,
  policy4: false,
  policy5: false,
};

const BookingPage: React.FC<BookingPageProps> = ({ setLastBooking }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const t = useTranslations();

  const [formData, setFormData] = useState<BookingFormData>(initialFormData);
  const [checkInDate, setCheckInDate] = useState<string | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<string | null>(null);
  const [policies, setPolicies] = useState(initialPolicyState);
  
  const [prices, setPrices] = useState<DailyPrices | null>(null);
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [totalPrice, setTotalPrice] = useState<number | null>(null);
  const [basePrice, setBasePrice] = useState<number | null>(null);
  const [discount, setDiscount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // LINE 和優惠券相關
  const [lineUserId, setLineUserId] = useState<string | null>(null);
  const [lineUserInfo, setLineUserInfo] = useState<{ name?: string; picture?: string } | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedCouponCode, setSelectedCouponCode] = useState<string | null>(null);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [syncProfileStatus, setSyncProfileStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [showLineInfoModal, setShowLineInfoModal] = useState(false); // ✅ 新增：LIFF 彈窗提醒

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [priceSettings, allUnavailableDates] = await Promise.all([
          apiService.getPriceSettings(),
          apiService.getUnavailableDates(),
        ]);
        setPrices(priceSettings);
        setUnavailableDates(allUnavailableDates);
      } catch (err) {
        setError(t.errors.loadInfo);
      }
    };
    fetchData();
  }, [t]);

  // 檢查 URL 參數中的優惠券代碼
  useEffect(() => {
    if (location.state && (location.state as any).couponCode) {
      setSelectedCouponCode((location.state as any).couponCode);
    }
  }, [location]);

  // 同步客戶資料到 Sheets
  const syncCustomerProfile = useCallback(async (userId: string, name?: string, picture?: string) => {
    try {
      setSyncProfileStatus('syncing');
      
      // 嘗試取得現有客戶資料
      let existingProfile: { guestName?: string; contactPhone?: string; email?: string } | null = null;
      try {
        existingProfile = await apiService.getCustomerProfile(userId);
      } catch (err) {
        // 客戶資料不存在是正常的，將建立新資料
      }
      
      // 同步客戶資料（建立或更新）
      const result = await apiService.syncCustomerProfile(
        userId,
        name,
        picture,
        existingProfile?.guestName,
        existingProfile?.contactPhone,
        existingProfile?.email
      );
      
      // 如果客戶資料已存在，自動填入表單
      if (result.profile && existingProfile) {
        setFormData(prev => ({
          ...prev,
          guestName: prev.guestName || result.profile.guestName || '',
          contactPhone: prev.contactPhone || result.profile.contactPhone || '',
          email: prev.email || result.profile.email || '',
          lineName: prev.lineName || result.profile.lineName || name || '',
        }));
      } else if (result.profile && name) {
        // 新客戶，填入 LINE 名稱
        setFormData(prev => ({
          ...prev,
          lineName: prev.lineName || name,
        }));
      }
      
      setSyncProfileStatus('success');
    } catch (err) {
      console.error('Error syncing customer profile:', err);
      setSyncProfileStatus('error');
    }
  }, []);

  // 處理 LINE OAuth callback（從 URL 參數取得 code）
  // ✅ 修正：只有在 LINE 環境中才處理 OAuth callback，一般瀏覽器不應該處理
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    console.log('[BookingPage] OAuth callback check:', { 
      hasCode: !!code, 
      hasState: !!state,
      currentUrl: window.location.href,
    });
    
    // ✅ 修正：如果沒有 code 和 state，不執行任何 LINE 相關操作
    if (!code || !state) {
      return;
    }
    
    // ✅ 修正：檢查是否在 LINE 環境中（userAgent 檢查）
    const userAgent = navigator.userAgent || '';
    const hasLineUserAgent = userAgent.includes('Line') || userAgent.includes('LINE');
    
    if (!hasLineUserAgent) {
      // 一般瀏覽器不應該有 OAuth callback（可能是誤觸）
      console.log('[BookingPage] OAuth callback detected but not in LINE environment, clearing URL params');
      // 清除 URL 參數，但不執行 LINE 登入
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
      return;
    }
    
    // ✅ 記錄到後台監測
    frontendLogger.log({
      service: 'line',
      action: 'oauth_callback_detected',
      status: 'info',
      message: 'OAuth callback detected on booking page (LINE environment)',
      details: {
        hasCode: !!code,
        hasState: !!state,
        url: window.location.href,
        inLineEnv: true,
      },
    });
    
    if (code && state) {
      // ✅ 修正：使用 sessionStorage 標記防止重複處理
      const processingKey = `oauth_processing_${state}`;
      if (sessionStorage.getItem(processingKey)) {
        console.log('[BookingPage] OAuth callback already processing, skipping...');
        return;
      }
      sessionStorage.setItem(processingKey, 'true');
      
      console.log('[BookingPage] Processing OAuth callback...');
      
      // 處理 OAuth callback
      import('../utils/lineLogin').then(({ handleLineOAuthCallback }) => {
        console.log('[BookingPage] handleLineOAuthCallback imported, calling...');
        return handleLineOAuthCallback();
      }).then(async (token) => {
        console.log('[BookingPage] Callback completed, token:', !!token);
        
        if (token) {
          try {
            console.log('[BookingPage] Verifying token...');
            // 驗證 token 並取得 UID（token 可能是 accessToken 或 idToken）
            const result = await apiService.verifyLineToken(token);
            console.log('[BookingPage] Token verified, LINE User ID:', result.lineUserId);
            
            // ✅ 修正：先更新狀態，再清除 URL
            setLineUserId(result.lineUserId);
            setLineUserInfo({ name: result.name, picture: result.picture });
            localStorage.setItem('lineUserId', result.lineUserId);
            
            // ✅ 記錄到後台監測
            frontendLogger.log({
              service: 'line',
              action: 'booking_page_login_success',
              status: 'success',
              message: 'LINE login successful on booking page',
              userId: result.lineUserId,
              details: {
                name: result.name,
                hasPicture: !!result.picture,
              },
            });
            
            // 同步客戶資料到 Sheets
            console.log('[BookingPage] Syncing customer profile...');
            await syncCustomerProfile(result.lineUserId, result.name, result.picture);
            
            // 載入優惠券
            console.log('[BookingPage] Loading coupons...');
            loadCoupons(result.lineUserId);
            
            // ✅ 修正：在處理完所有狀態後再清除 URL（使用 React Router 的方式）
            const returnPath = sessionStorage.getItem('line_oauth_return_path') || '/booking';
            sessionStorage.removeItem('line_oauth_return_path');
            sessionStorage.removeItem('line_oauth_redirect_uri');
            
            // 使用 setTimeout 確保狀態更新完成後再清除 URL
            setTimeout(() => {
              window.history.replaceState({}, '', returnPath);
              // 使用 navigate 更新 React Router 狀態（但不重新載入）
              navigate(returnPath, { replace: true });
            }, 100);
            
            console.log('[BookingPage] OAuth callback processing completed successfully');
          } catch (err) {
            console.error('[BookingPage] Error processing token:', err);
            setSyncProfileStatus('error');
            sessionStorage.removeItem(processingKey); // 失敗時清除標記
          }
        } else {
          console.warn('[BookingPage] OAuth callback returned null token');
          setSyncProfileStatus('error');
          sessionStorage.removeItem(processingKey); // 失敗時清除標記
        }
      }).catch((err) => {
        console.error('[BookingPage] Error handling OAuth callback:', err);
        setSyncProfileStatus('error');
        sessionStorage.removeItem(processingKey); // 錯誤時清除標記
      });
      return;
    }

    // 載入 LINE 使用者資訊（僅在真正的 LIFF 環境中）
    const loadLineUser = async () => {
      // ✅ 修正：先檢查 userAgent，如果包含 LINE 才初始化 LIFF
      const userAgent = navigator.userAgent || '';
      const hasLineUserAgent = userAgent.includes('Line') || userAgent.includes('LINE');
      
      console.log('[BookingPage] Loading LINE user check:', { 
        hasLineUserAgent,
        userAgent: userAgent.substring(0, 100),
      });
      
      // ✅ 記錄到後台監測
      frontendLogger.log({
        service: 'line',
        action: 'booking_page_line_check',
        status: 'info',
        message: 'Checking LINE environment on booking page',
        details: {
          hasLineUserAgent,
          userAgent: userAgent.substring(0, 100),
        },
      });
      
      // 如果 userAgent 不包含 LINE，肯定不是 LINE 環境，不執行任何 LINE 相關操作
      if (!hasLineUserAgent) {
        console.log('[BookingPage] Not in LINE environment (userAgent check)');
        // ✅ 修正：一般瀏覽器不自動獲取 LINE UID，也不使用 localStorage 的 lineUserId
        // 用戶可以透過確認頁的綁定按鈕來綁定 LINE 帳號
        return;
      }
      
      // userAgent 包含 LINE，嘗試初始化 LIFF
      try {
        console.log('[BookingPage] UserAgent contains LINE, initializing LIFF...');
        // 初始化 LIFF
        await initLineLogin();
        
        // 等待 LIFF 完全初始化
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // ✅ 修正：使用 isInLine() 嚴格判斷是否在真正的 LIFF 環境
        // isInLine() 會檢查 window.liff.isInClient() === true
        const isReallyInLine = isInLine();
        
        console.log('[BookingPage] LIFF initialized, isReallyInLine:', isReallyInLine);
        
        // ✅ 只有確認在真正的 LIFF 環境中才獲取 LINE UID
        if (isReallyInLine) {
          console.log('[BookingPage] Confirmed in LIFF environment, getting LINE profile...');
          const lineUser = await getLineProfile();
          
          if (lineUser && lineUser.lineUserId) {
            console.log('[BookingPage] LINE user loaded:', {
              lineUserId: lineUser.lineUserId,
              name: lineUser.name,
            });
            
            // 設定狀態
            setLineUserId(lineUser.lineUserId);
            setLineUserInfo({ name: lineUser.name, picture: lineUser.picture });
            localStorage.setItem('lineUserId', lineUser.lineUserId);
            
            // ✅ 記錄到後台監測
            frontendLogger.log({
              service: 'line',
              action: 'booking_page_liff_success',
              status: 'success',
              message: 'LINE user loaded successfully via LIFF on booking page',
              userId: lineUser.lineUserId,
              details: {
                name: lineUser.name,
                hasPicture: !!lineUser.picture,
              },
            });
            
            // 同步客戶資料到 Sheets（確保 LINE UID 正確記錄）
            console.log('[BookingPage] Syncing customer profile to Sheets...');
            try {
              await syncCustomerProfile(lineUser.lineUserId, lineUser.name, lineUser.picture);
              console.log('[BookingPage] Customer profile synced successfully');
              frontendLogger.log({
                service: 'line',
                action: 'booking_page_profile_synced',
                status: 'success',
                message: 'Customer profile synced to Sheets',
                userId: lineUser.lineUserId,
              });
            } catch (syncErr) {
              console.error('[BookingPage] Error syncing customer profile:', syncErr);
              setSyncProfileStatus('error');
              frontendLogger.log({
                service: 'line',
                action: 'booking_page_profile_sync_failed',
                status: 'error',
                message: 'Failed to sync customer profile',
                userId: lineUser.lineUserId,
                details: {
                  error: syncErr instanceof Error ? syncErr.message : String(syncErr),
                },
              });
            }
            
            // 載入優惠券
            loadCoupons(lineUser.lineUserId);
            
            // ✅ 新增：顯示 LIFF 進入提醒彈窗
            setShowLineInfoModal(true);
          } else {
            // 如果 getLineProfile 返回 null，可能是因為：
            // 1. 未登入（已觸發自動登入，等待重新載入）
            // 2. LIFF 初始化失敗
            console.log('[BookingPage] LINE user not logged in or LIFF not available, waiting for login...');
          }
        } else {
          // ✅ 修正：雖然 userAgent 包含 LINE，但不是真正的 LIFF 環境
          // 可能是從 LINE App 打開，但 LIFF 初始化失敗或不支援
          console.log('[BookingPage] UserAgent contains LINE but not in true LIFF environment, skipping auto-login');
          console.log('[BookingPage] User can bind LINE account later on confirmation page');
        }
      } catch (err) {
        console.error('[BookingPage] Error loading LINE user:', err);
        setSyncProfileStatus('error');
        frontendLogger.log({
          service: 'line',
          action: 'booking_page_line_load_error',
          status: 'error',
          message: 'Error loading LINE user',
          details: {
            error: err instanceof Error ? err.message : String(err),
          },
        });
      }
    };
    loadLineUser();
  }, [syncCustomerProfile]);

  const loadCoupons = async (userId: string) => {
    try {
      setLoadingCoupons(true);
      const userCoupons = await apiService.getCustomerCoupons(userId);
      setCoupons(userCoupons.filter(c => {
        if (c.status !== 'active') return false;
        if (c.expiresAt && new Date(c.expiresAt) < new Date()) return false;
        return true;
      }));
    } catch (err) {
      console.error('Error loading coupons:', err);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const nights = useMemo(() => {
    if (checkInDate && checkOutDate) {
      const start = new Date(checkInDate);
      const end = new Date(checkOutDate);
      if (end > start) {
        return Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
      }
    }
    return 0;
  }, [checkInDate, checkOutDate]);

  // 計算價格（包含優惠券折扣）
  useEffect(() => {
    if (prices && checkInDate && checkOutDate && nights > 0) {
      let calculatedBasePrice = 0;
      const parts = checkInDate.split('-').map(Number);
      const currentDate = new Date(parts[0], parts[1] - 1, parts[2]);

      for (let i = 0; i < nights; i++) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const dayOfMonth = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${dayOfMonth}`;
        
        const dayOfWeek = currentDate.getDay();
        const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
        const dailyPrice = prices.dates[dateStr] ?? (isWeekend ? prices.defaultWeekend : prices.defaultWeekday);
        
        calculatedBasePrice += dailyPrice;

        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      setBasePrice(calculatedBasePrice);

      // 如果有選擇優惠券且有 LINE User ID，計算折扣
      if (selectedCouponCode && lineUserId && checkInDate && checkOutDate) {
        apiService.applyCoupon(selectedCouponCode, checkInDate, checkOutDate, lineUserId)
          .then((result) => {
            if (result.valid) {
              setDiscount(result.coupon.value);
              setTotalPrice(Math.max(0, calculatedBasePrice - result.coupon.value));
            } else {
              setDiscount(0);
              setTotalPrice(calculatedBasePrice);
            }
          })
          .catch(() => {
            setDiscount(0);
            setTotalPrice(calculatedBasePrice);
          });
      } else {
        setDiscount(0);
        setTotalPrice(calculatedBasePrice);
      }
    } else {
      setBasePrice(null);
      setTotalPrice(null);
      setDiscount(0);
    }
  }, [checkInDate, checkOutDate, prices, nights, selectedCouponCode, lineUserId]);

  const handleDateChange = (start: string | null, end: string | null) => {
    setCheckInDate(start);
    setCheckOutDate(end);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target as { name: keyof BookingFormData, value: 'yes' | 'no' };
    setFormData(prev => ({...prev, [name]: value}));
  };

  const handlePolicyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setPolicies(prev => ({...prev, [name]: checked}));
  }

  const allPoliciesAgreed = Object.values(policies).every(p => p === true);
  const isFormValid = useMemo(() => {
    return (
        formData.guestName &&
        formData.contactPhone &&
        formData.email &&
        formData.lineName &&
        formData.numberOfGuests > 0 &&
        checkInDate &&
        checkOutDate &&
        allPoliciesAgreed
    );
  }, [formData, checkInDate, checkOutDate, allPoliciesAgreed]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !totalPrice || !checkInDate || !checkOutDate) {
      setError(t.errors.fillAllFields);
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const response = await apiService.createBooking({
        guestName: formData.guestName,
        contactPhone: formData.contactPhone,
        email: formData.email,
        lineName: formData.lineName,
        lineUserId: lineUserId || undefined,
        checkInDate,
        checkOutDate,
        numberOfGuests: Number(formData.numberOfGuests),
        useCoupon: selectedCouponCode !== null,
        couponCode: selectedCouponCode || undefined,
        arrivalTime: formData.arrivalTime,
        totalPrice: totalPrice || 0,
      });
      
      // 構建完整的 Booking 物件用於確認頁面
      const completeBooking: Booking = {
        id: response.id,
        guestName: formData.guestName,
        contactPhone: formData.contactPhone,
        email: formData.email,
        lineName: formData.lineName,
        lineUserId: lineUserId || undefined,
        checkInDate,
        checkOutDate,
        numberOfGuests: Number(formData.numberOfGuests),
        useCoupon: selectedCouponCode !== null,
        couponCode: selectedCouponCode || undefined,
        arrivalTime: formData.arrivalTime,
        totalPrice: totalPrice || 0,
        status: response.status as 'pending' | 'confirmed' | 'cancelled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setLastBooking(completeBooking);
      navigate('/confirmation');
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(t.errors[errorMessage] || t.errors.bookingFailed);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-amber-50">
      <HeaderMenu />
      <div className="max-w-4xl mx-auto px-4 py-10 md:py-16">
        <div className="text-center mb-6 md:mb-10">
          <h1 className="text-3xl md:text-5xl font-bold text-slate-800 tracking-tight">{t.bookingPage.title}</h1>
          <div className="w-20 h-1 bg-gradient-to-r from-amber-400 to-amber-600 mx-auto mt-4 rounded-full"></div>
          <p className="text-slate-600 mt-4 text-base md:text-lg">{t.bookingPage.subtitle}</p>
        </div>
        <div className="w-full bg-white rounded-xl shadow-xl p-6 md:p-8 space-y-6 border border-amber-100">
        
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h2 className="font-bold text-lg text-brand-dark mb-2">{t.bookingPage.priceInfo.title}</h2>
            {prices ? (
                <div className="text-gray-700 space-y-2 text-base">
                    <p>
                        {t.bookingPage.priceInfo.weekday}: ${prices.defaultWeekday.toLocaleString()} / {t.bookingPage.priceInfo.night}
                    </p>
                    <p>
                        {t.bookingPage.priceInfo.weekend}: ${prices.defaultWeekend.toLocaleString()} / {t.bookingPage.priceInfo.night}
                    </p>
                    <p className="text-sm text-gray-500 pt-1">{t.bookingPage.priceInfo.holidayDefinition}</p>
                </div>
            ) : (
                <p className="text-gray-700">{t.bookingPage.priceInfo.loading}</p>
            )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="guestName" className="block text-base font-medium text-gray-700">{t.form.guestName} <span className="text-red-500">*</span></label>
              <input type="text" id="guestName" name="guestName" value={formData.guestName} onChange={handleInputChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand-secondary focus:border-brand-secondary text-base"/>
            </div>
            <div>
              <label htmlFor="contactPhone" className="block text-base font-medium text-gray-700">{t.form.contactPhone} <span className="text-red-500">*</span></label>
              <input type="tel" id="contactPhone" name="contactPhone" value={formData.contactPhone} onChange={handleInputChange} required pattern="09\d{8}" maxLength={10} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand-secondary focus:border-brand-secondary text-base" placeholder={t.form.contactPhonePlaceholder}/>
            </div>
            <div>
              <label htmlFor="email" className="block text-base font-medium text-gray-700">{t.form.email} <span className="text-red-500">*</span></label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand-secondary focus:border-brand-secondary text-base" placeholder={t.form.emailPlaceholder}/>
            </div>
             <div>
              <label htmlFor="lineName" className="block text-base font-medium text-gray-700">{t.form.lineName} <span className="text-red-500">*</span></label>
              <input type="text" id="lineName" name="lineName" value={formData.lineName} onChange={handleInputChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand-secondary focus:border-brand-secondary text-base"/>
            </div>
          </div>
          
           <div>
              <label className="block text-base font-medium text-gray-700 mb-2">{t.form.checkInCheckOut} <span className="text-red-500">*</span></label>
              {prices ? (
                <BookingPriceCalendar 
                  prices={prices}
                  unavailableDates={unavailableDates}
                  onDateChange={handleDateChange}
                />
              ) : (
                <div className="text-center p-8 bg-gray-100 rounded-md">{t.form.loadingCalendar}</div>
              )}
          </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label htmlFor="numberOfGuests" className="block text-base font-medium text-gray-700">{t.form.numberOfGuests} <span className="text-red-500">*</span></label>
                  <input type="number" id="numberOfGuests" name="numberOfGuests" min="1" max="4" value={formData.numberOfGuests} onChange={handleInputChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand-secondary focus:border-brand-secondary text-base"/>
                </div>
                 <div>
                  <label htmlFor="arrivalTime" className="block text-base font-medium text-gray-700">{t.form.arrivalTime}</label>
                  <input type="time" id="arrivalTime" name="arrivalTime" value={formData.arrivalTime} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand-secondary focus:border-brand-secondary text-base"/>
                </div>
           </div>
           
           {/* LINE 綁定狀態和優惠券選擇 */}
           {lineUserId && (
             <div className="p-4 bg-green-50 rounded-lg border border-green-200">
               <div className="flex items-center gap-3 mb-3">
                 {lineUserInfo?.picture && (
                   <img src={lineUserInfo.picture} alt="LINE" className="w-12 h-12 rounded-full border-2 border-green-300" />
                 )}
                 <div className="flex-1">
                   <div className="flex items-center gap-2">
                     <p className="text-base text-green-800 font-semibold">
                       ✅ 已綁定 LINE 帳號
                     </p>
                     {syncProfileStatus === 'syncing' && (
                       <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                         <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                         </svg>
                         同步中...
                       </span>
                     )}
                     {syncProfileStatus === 'success' && (
                       <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-200 text-green-800">
                         ✓ 已同步
                       </span>
                     )}
                     {syncProfileStatus === 'error' && (
                       <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                         ⚠ 同步失敗
                       </span>
                     )}
                   </div>
                   {lineUserInfo?.name && (
                     <p className="text-sm text-green-700 mt-1">LINE 名稱：{lineUserInfo.name}</p>
                   )}
                   {syncProfileStatus === 'success' && (
                     <p className="text-xs text-green-600 mt-1">會員資料已同步建立到系統</p>
                   )}
                 </div>
               </div>
               {loadingCoupons ? (
                 <div className="flex items-center gap-2 text-sm text-gray-600">
                   <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   載入優惠券中...
                 </div>
               ) : coupons.length > 0 ? (
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     選擇優惠券（選填）
                   </label>
                   <select
                     value={selectedCouponCode || ''}
                     onChange={(e) => setSelectedCouponCode(e.target.value || null)}
                     className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand-secondary focus:border-brand-secondary text-base"
                   >
                     <option value="">不使用優惠券</option>
                     {coupons.map((coupon) => (
                       <option key={coupon.id} value={coupon.couponCode}>
                         {coupon.type === 'free_night' 
                           ? `10晚送1晚 (${coupon.couponCode})` 
                           : `住兩晚折300 (${coupon.couponCode})`}
                       </option>
                     ))}
                   </select>
                 </div>
               ) : (
                 <div className="bg-white p-3 rounded-md border border-green-200">
                   <p className="text-sm text-gray-700 font-medium mb-1">
                     目前沒有可用的優惠券
                   </p>
                   <p className="text-xs text-gray-600">
                     訂房後即可獲得專屬優惠！每住兩晚可獲得「住兩晚折300元」，累計10晚可獲得「10晚送1晚住宿券」！
                   </p>
                 </div>
               )}
             </div>
           )}

           <div>
               <label className="block text-base font-medium text-gray-700">{t.form.useCoupon} <span className="text-gray-500 text-xs">{t.form.useCouponNote}</span></label>
                <div className="mt-2 space-x-4">
                    <label className="inline-flex items-center">
                        <input 
                          type="radio" 
                          name="useCoupon" 
                          value="yes" 
                          checked={formData.useCoupon === 'yes'} 
                          onChange={handleRadioChange} 
                          className="form-radio"
                          disabled={!lineUserId || coupons.length === 0}
                        />
                        <span className={`ml-2 text-base ${!lineUserId || coupons.length === 0 ? 'text-gray-400' : ''}`}>{t.form.yes}</span>
                    </label>
                    <label className="inline-flex items-center">
                        <input type="radio" name="useCoupon" value="no" checked={formData.useCoupon === 'no'} onChange={handleRadioChange} className="form-radio"/>
                        <span className="ml-2 text-base">{t.form.no}</span>
                    </label>
                </div>
           </div>

          <div>
            <h3 className="block text-base font-medium text-gray-700">{t.bookingPage.policies.title} <span className="text-red-500">*</span></h3>
            <div className="mt-2 space-y-2 text-base text-gray-600">
              <label className="flex items-start">
                  <input type="checkbox" name="policy1" checked={policies.policy1} onChange={handlePolicyChange} className="form-checkbox h-5 w-5 shrink-0 mt-0.5" />
                  <span className="ml-2">{t.bookingPage.policies.policy1}</span>
              </label>
              <label className="flex items-start">
                  <input type="checkbox" name="policy2" checked={policies.policy2} onChange={handlePolicyChange} className="form-checkbox h-5 w-5 shrink-0 mt-0.5" />
                  <span className="ml-2">{t.bookingPage.policies.policy2}</span>
              </label>
              <label className="flex items-start">
                  <input type="checkbox" name="policy3" checked={policies.policy3} onChange={handlePolicyChange} className="form-checkbox h-5 w-5 shrink-0 mt-0.5" />
                  <span className="ml-2">{t.bookingPage.policies.policy3}</span>
              </label>
              <label className="flex items-start">
                  <input type="checkbox" name="policy4" checked={policies.policy4} onChange={handlePolicyChange} className="form-checkbox h-5 w-5 shrink-0 mt-0.5" />
                  <span className="ml-2">{t.bookingPage.policies.policy4}</span>
              </label>
              <label className="flex items-start">
                  <input type="checkbox" name="policy5" checked={policies.policy5} onChange={handlePolicyChange} className="form-checkbox h-5 w-5 shrink-0 mt-0.5" />
                  <span className="ml-2">{t.bookingPage.policies.policy5}</span>
              </label>
            </div>
          </div>
          
          {error && <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">{error}</div>}

          <div className="bg-amber-50 p-4 rounded-lg text-center border border-amber-100">
            {totalPrice !== null && nights > 0 ? (
              <div>
                <span className="text-gray-600 text-base">{`${t.bookingPage.total.nightsPrefix} ${nights} ${t.bookingPage.total.nightsSuffix}, `}</span>
                {basePrice !== null && basePrice !== totalPrice && discount > 0 && (
                  <div className="mb-1">
                    <span className="text-sm text-gray-500 line-through">
                      NT$ {basePrice.toLocaleString()}
                    </span>
                    <span className="ml-2 text-sm text-green-600 font-semibold">
                      -NT$ {discount.toLocaleString()}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-xl font-bold text-brand-primary ml-1">{t.bookingPage.total.totalPrice} {totalPrice.toLocaleString()} {t.bookingPage.total.currency}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">{t.bookingPage.total.selectDates}</p>
            )}
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className="w-full flex justify-center py-3 px-6 rounded-xl text-lg font-semibold text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 shadow-lg focus:outline-none focus:ring-4 focus:ring-amber-300/50 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t.buttons.submitting : t.buttons.confirmBooking}
            </button>
          </div>
        </form>
        </div>
      </div>
      
      {/* ✅ 新增：LIFF 進入提醒彈窗 */}
      {showLineInfoModal && lineUserInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {lineUserInfo.picture && (
                  <img 
                    src={lineUserInfo.picture} 
                    alt="LINE" 
                    className="w-12 h-12 rounded-full border-2 border-green-300" 
                  />
                )}
                <div>
                  <h3 className="text-lg font-bold text-gray-800">✅ LINE 訊息已獲取</h3>
                  {lineUserInfo.name && (
                    <p className="text-sm text-gray-600">歡迎，{lineUserInfo.name}！</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowLineInfoModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <p className="text-sm text-green-800 font-medium mb-2">
                🎉 已自動取得您的 LINE 資訊
              </p>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• 已自動綁定 LINE 帳號</li>
                <li>• 會員資料已同步建立</li>
                <li>• 可立即使用常客優惠券</li>
              </ul>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowLineInfoModal(false)}
                className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                我知道了
              </button>
              <Link
                to="/benefits"
                onClick={() => setShowLineInfoModal(false)}
                className="flex-1 py-2 px-4 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50 transition-colors font-medium text-center"
              >
                查看優惠券
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingPage;