// pages/BookingPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Booking, DailyPrices, BookingFormData } from '../types';
import { apiService } from '../services/apiService';
import BookingPriceCalendar from '../components/BookingPriceCalendar';
import HeaderMenu from '../components/HeaderMenu';
import { useTranslations } from '../contexts/LanguageContext';

interface BookingPageProps {
  setLastBooking: (booking: Booking) => void;
}

const initialFormData: BookingFormData = {
  guestName: '',
  contactPhone: '',
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
  const t = useTranslations();

  const [formData, setFormData] = useState<BookingFormData>(initialFormData);
  const [checkInDate, setCheckInDate] = useState<string | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<string | null>(null);
  const [policies, setPolicies] = useState(initialPolicyState);
  
  const [prices, setPrices] = useState<DailyPrices | null>(null);
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [totalPrice, setTotalPrice] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  useEffect(() => {
    if (prices && checkInDate && checkOutDate && nights > 0) {
      let calculatedPrice = 0;
      const parts = checkInDate.split('-').map(Number);
      const currentDate = new Date(parts[0], parts[1] - 1, parts[2]);

      for (let i = 0; i < nights; i++) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const dayOfMonth = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${dayOfMonth}`;
        
        const dayOfWeek = currentDate.getDay();
        // A "weekend night" is Friday night (5) or Saturday night (6). Sunday night is a weekday night.
        const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
        const dailyPrice = prices.dates[dateStr] ?? (isWeekend ? prices.defaultWeekend : prices.defaultWeekday);
        
        calculatedPrice += dailyPrice;

        currentDate.setDate(currentDate.getDate() + 1);
      }
      setTotalPrice(calculatedPrice);
    } else {
      setTotalPrice(null);
    }
  }, [checkInDate, checkOutDate, prices, nights]);

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
        lineName: formData.lineName,
        checkInDate,
        checkOutDate,
        numberOfGuests: Number(formData.numberOfGuests),
        useCoupon: formData.useCoupon === 'yes',
        arrivalTime: formData.arrivalTime,
        totalPrice,
      });
      
      // 構建完整的 Booking 物件用於確認頁面
      const completeBooking: Booking = {
        id: response.id,
        guestName: formData.guestName,
        contactPhone: formData.contactPhone,
        lineName: formData.lineName,
        checkInDate,
        checkOutDate,
        numberOfGuests: Number(formData.numberOfGuests),
        useCoupon: formData.useCoupon === 'yes',
        arrivalTime: formData.arrivalTime,
        totalPrice,
        status: response.status,
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 relative">
      <HeaderMenu />
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-6 md:p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-brand-dark tracking-tight">{t.bookingPage.title}</h1>
          <p className="text-gray-600 mt-4 text-base">{t.bookingPage.subtitle}</p>
        </div>
        
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
           
           <div>
               <label className="block text-base font-medium text-gray-700">{t.form.useCoupon} <span className="text-gray-500 text-xs">{t.form.useCouponNote}</span></label>
                <div className="mt-2 space-x-4">
                    <label className="inline-flex items-center">
                        <input type="radio" name="useCoupon" value="yes" checked={formData.useCoupon === 'yes'} onChange={handleRadioChange} className="form-radio"/>
                        <span className="ml-2 text-base">{t.form.yes}</span>
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

          <div className="bg-gray-50 p-4 rounded-lg text-center">
            {totalPrice !== null && nights > 0 ? (
              <div>
                <span className="text-gray-600 text-base">{`${t.bookingPage.total.nightsPrefix} ${nights} ${t.bookingPage.total.nightsSuffix}, `}</span>
                <span className="text-xl font-bold text-brand-primary ml-1">{t.bookingPage.total.totalPrice} {totalPrice.toLocaleString()} {t.bookingPage.total.currency}</span>
              </div>
            ) : (
              <p className="text-gray-500">{t.bookingPage.total.selectDates}</p>
            )}
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-brand-primary hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t.buttons.submitting : t.buttons.confirmBooking}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingPage;