// pages/ConfirmationPage.tsx

import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Booking } from '../types';
import { generateICSFile } from '../utils/fileGenerators';
import { CheckCircleIcon, CalendarDaysIcon } from '../components/icons';
import { useTranslations } from '../contexts/LanguageContext';

interface ConfirmationPageProps {
  booking: Booking | null;
}

const ConfirmationPage: React.FC<ConfirmationPageProps> = ({ booking }) => {
  const t = useTranslations();

  if (!booking) {
    return <Navigate to="/" replace />;
  }

  const {
    guestName,
    checkInDate,
    checkOutDate,
    numberOfGuests,
    totalPrice,
    contactPhone,
    lineName,
  } = booking;

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
            {t.buttons.backToBooking}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPage;