// components/BookingPriceCalendar.tsx (For Guest Booking Page)

import React, { useState, useMemo, useEffect } from 'react';
import { DailyPrices } from '../types';
import { formatDateToYYYYMMDD } from '../utils/dateUtils';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';

interface BookingPriceCalendarProps {
  prices: DailyPrices;
  unavailableDates: string[];
  onDateChange: (checkIn: string | null, checkOut: string | null) => void;
}

const today = new Date();
today.setHours(0, 0, 0, 0);

const maxDate = new Date();
maxDate.setDate(today.getDate() + 183);
maxDate.setHours(0, 0, 0, 0);

const BookingPriceCalendar: React.FC<BookingPriceCalendarProps> = ({ prices, unavailableDates, onDateChange }) => {
  const { lang } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  useEffect(() => {
    onDateChange(
        checkInDate ? formatDateToYYYYMMDD(checkInDate) : null,
        checkOutDate ? formatDateToYYYYMMDD(checkOutDate) : null
    );
  }, [checkInDate, checkOutDate, onDateChange]);

  const { month, year, daysInMonth, firstDayOfMonth, monthName, yearName, weekdays } = useMemo(() => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const locale = lang === 'en' ? 'en-US' : 'zh-TW';
    
    // Generate weekday names based on locale
    const weekdayNames = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(2024, 0, i + 7); // A week that starts on Sunday
        weekdayNames.push(day.toLocaleString(locale, { weekday: 'short' }));
    }

    return {
      month,
      year,
      daysInMonth: new Date(year, month + 1, 0).getDate(),
      firstDayOfMonth: new Date(year, month, 1).getDay(),
      monthName: currentDate.toLocaleString(locale, { month: 'long' }),
      yearName: currentDate.toLocaleString(locale, { year: 'numeric' }),
      weekdays: weekdayNames,
    };
  }, [currentDate, lang]);

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => {
        const newDate = new Date(prev.getFullYear(), prev.getMonth() + offset, 1);
        if (newDate < new Date(today.getFullYear(), today.getMonth(), 1)) return prev;
        const maxDateMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
        if (newDate > maxDateMonth) return prev;
        return newDate;
    });
  };

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(year, month, day);
    if (clickedDate < today || clickedDate > maxDate) return;

    const dateStr = formatDateToYYYYMMDD(clickedDate);
    
    if (unavailableDates.includes(dateStr)) return;

    if (!checkInDate || (checkInDate && checkOutDate)) {
        setCheckInDate(clickedDate);
        setCheckOutDate(null);
    } else if (clickedDate > checkInDate) {
        // Check if range is valid
        let tempDate = new Date(checkInDate);
        tempDate.setDate(tempDate.getDate() + 1);
        while (tempDate < clickedDate) {
            const tempDateStr = formatDateToYYYYMMDD(tempDate);
            if (unavailableDates.includes(tempDateStr)) {
                // Invalid range, reset selection
                setCheckInDate(clickedDate);
                setCheckOutDate(null);
                return;
            }
            tempDate.setDate(tempDate.getDate() + 1);
        }
        setCheckOutDate(clickedDate);
    } else {
        setCheckInDate(clickedDate);
        setCheckOutDate(null);
    }
  };

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(<div key={`empty-start-${i}`} className="border-t border-r border-gray-200"></div>);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = formatDateToYYYYMMDD(date);
    
    const isPast = date < today;
    const isBeyondMax = date > maxDate;
    const isUnavailable = unavailableDates.includes(dateStr);
    const isDisabled = isPast || isUnavailable || isBeyondMax;

    const dayOfWeek = date.getDay();
    // A "weekend night" is Friday night (5) or Saturday night (6).
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
    const price = prices.dates[dateStr] ?? (isWeekend ? prices.defaultWeekend : prices.defaultWeekday);

    let inRange = false;
    if (checkInDate && hoverDate && hoverDate > checkInDate && !checkOutDate) {
        inRange = date > checkInDate && date < hoverDate;
    } else if (checkInDate && checkOutDate) {
        inRange = date > checkInDate && date < checkOutDate;
    }

    const isCheckIn = checkInDate?.getTime() === date.getTime();
    const isCheckOut = checkOutDate?.getTime() === date.getTime();
    
    // Explicitly define text color for price for better contrast control
    const priceTextColor = isCheckIn || isCheckOut ? 'text-white'
                         : inRange ? 'text-brand-dark'
                         : 'text-gray-600';

    const dayClasses = `
        relative p-2 text-center border-t border-r border-gray-200 flex flex-col justify-center items-center h-20
        ${isDisabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'cursor-pointer hover:bg-brand-light/50'}
        ${isCheckIn ? 'bg-brand-primary text-white rounded-l-full' : ''}
        ${isCheckOut ? 'bg-brand-primary text-white rounded-r-full' : ''}
        ${inRange ? 'bg-brand-light text-brand-dark' : ''}
    `;

    calendarDays.push(
      <div 
        key={day} 
        onClick={() => !isDisabled && handleDayClick(day)}
        onMouseEnter={() => setHoverDate(date)}
        onMouseLeave={() => setHoverDate(null)}
        className={dayClasses}
        >
        <span className="text-sm font-medium">{day}</span>
        {!isDisabled && <span className={`text-xs ${priceTextColor}`}>${price}</span>}
      </div>
    );
  }

  // Add empty cells to complete the grid
  const totalCells = firstDayOfMonth + daysInMonth;
  const remainingCells = (7 - (totalCells % 7)) % 7;
    for (let i = 0; i < remainingCells; i++) {
        calendarDays.push(<div key={`empty-end-${i}`} className="border-t border-r border-gray-200"></div>);
    }

  const isNextMonthDisabled = useMemo(() => {
      const nextMonth = new Date(year, month + 1, 1);
      return nextMonth > maxDate;
  }, [year, month]);

  return (
    <div className="border border-gray-200 rounded-lg">
        <div className="flex justify-between items-center p-2">
            <button type="button" onClick={() => changeMonth(-1)} disabled={currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear()} className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-50"><ChevronLeftIcon className="h-6 w-6" /></button>
            <h2 className="text-lg font-semibold">{yearName} {monthName}</h2>
            <button type="button" onClick={() => changeMonth(1)} disabled={isNextMonthDisabled} className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-50"><ChevronRightIcon className="h-6 w-6" /></button>
        </div>
        <div className="grid grid-cols-7 border-l border-b border-gray-200">
            {weekdays.map(d => <div key={d} className="text-center font-bold p-2 text-sm">{d}</div>)}
            {calendarDays}
        </div>
    </div>
  );
};

export default BookingPriceCalendar;