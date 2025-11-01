// pages/LookupPage.tsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import HeaderMenu from '../components/HeaderMenu';
import { apiService } from '../services/apiService';
import { Booking } from '../types';
import { useLanguage, useTranslations } from '../contexts/LanguageContext';

const LookupPage: React.FC = () => {
  const t = useTranslations();
  const { lang } = useLanguage();
  const [phone, setPhone] = useState('');
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      setError(t.lookupPage.errorEnterPhone);
      return;
    }
    setIsLoading(true);
    setError('');
    setSearched(true);
    setBookings(null);
    try {
      const results = await apiService.getBookingsByPhone(phone);
      setBookings(results);
    } catch (err) {
      setError(t.lookupPage.errorSearching);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusChip = (status: 'confirmed' | 'pending' | 'cancelled') => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">{t.status.confirmed}</span>;
      case 'pending':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">{t.status.pending}</span>;
      case 'cancelled':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">{t.status.cancelled}</span>;
      default:
        return null;
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-amber-50">
      <HeaderMenu />
      <div className="max-w-3xl mx-auto px-4 py-10 md:py-16">
        <div className="text-center mb-6 md:mb-10">
          <h1 className="text-3xl md:text-5xl font-bold text-slate-800">{t.lookupPage.title}</h1>
          <div className="w-20 h-1 bg-gradient-to-r from-amber-400 to-amber-600 mx-auto mt-4 rounded-full"></div>
          <p className="text-slate-600 mt-2 text-base md:text-lg">{t.lookupPage.subtitle}</p>
        </div>

        <div className="w-full bg-white rounded-xl shadow-xl p-6 md:p-8 space-y-6 border border-amber-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-base font-medium text-gray-700">{t.form.contactPhone}</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                pattern="09\d{8}"
                maxLength={10}
                placeholder="0912345678"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand-secondary focus:border-brand-secondary text-base"
              />
            </div>
            {error && <div className="text-red-600 text-sm text-center">{error}</div>}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-6 rounded-xl text-lg font-semibold text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 shadow-lg focus:outline-none focus:ring-4 focus:ring-amber-300/50 transition-all disabled:bg-gray-400"
              >
                {isLoading ? t.buttons.searching : t.buttons.search}
              </button>
            </div>
          </form>

          {searched && !isLoading && (
            <div className="border-t pt-6 mt-6">
              <h2 className="text-xl font-semibold text-center mb-4">{t.lookupPage.resultsTitle}</h2>
              {bookings && bookings.length > 0 ? (
                <div className="space-y-4">
                  {bookings.map(booking => (
                    <div key={booking.id} className="p-4 border rounded-md bg-gray-50">
                      <div className="flex justify-between items-start">
                          <div>
                              <p className="font-bold text-gray-800 text-lg">{t.lookupPage.bookingFor(booking.guestName)}</p>
                              <p className="text-sm text-gray-500">{booking.contactPhone}</p>
                              <p className="text-sm text-gray-500">{booking.email}</p>
                              <p className="text-base text-gray-600">{t.lookupPage.checkIn}: {booking.checkInDate}</p>
                              <p className="text-base text-gray-600">{t.lookupPage.checkOut}: {booking.checkOutDate}</p>
                          </div>
                          <div className="text-right">
                             {getStatusChip(booking.status)}
                             <p className="text-lg font-bold mt-2">{booking.totalPrice.toLocaleString()} {t.lookupPage.currency}</p>
                          </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">{t.lookupPage.noResults}</p>
              )}
            </div>
          )}
        </div>
      </div>
       <div className="w-full max-w-3xl mx-auto text-center py-4">
        <Link to="/" className="text-base text-gray-500 hover:text-brand-primary hover:underline">
          {lang === 'zh' ? '返回首頁' : 'Back to Home'}
        </Link>
      </div>
    </div>
  );
};

export default LookupPage;