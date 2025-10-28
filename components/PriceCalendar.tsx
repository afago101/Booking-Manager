// components/PriceCalendar.tsx (For Admin Price Settings)

import React, { useState, useMemo } from 'react';
import { DailyPrices } from '../types';
import { formatDateToYYYYMMDD } from '../utils/dateUtils';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface PriceCalendarProps {
  initialPrices: DailyPrices;
  onPricesChange: (newSettings: DailyPrices) => void;
}

const PriceCalendar: React.FC<PriceCalendarProps> = ({ initialPrices, onPricesChange }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { month, year, daysInMonth, firstDayOfMonth } = useMemo(() => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    return {
      month,
      year,
      daysInMonth: new Date(year, month + 1, 0).getDate(),
      firstDayOfMonth: new Date(year, month, 1).getDay(),
    };
  }, [currentDate]);

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };
  
  const handleDefaultPriceChange = (type: 'defaultWeekday' | 'defaultWeekend', value: string) => {
      const newPrice = value === '' ? 0 : parseInt(value, 10);
      if (!isNaN(newPrice)) {
          onPricesChange({
              ...initialPrices,
              [type]: newPrice
          });
      }
  };

  const handleDatePriceChange = (dateStr: string, value: string) => {
      const newPrices = { ...initialPrices, dates: {...initialPrices.dates} };
      
      if (value === '') {
          delete newPrices.dates[dateStr];
      } else {
        const newPrice = parseInt(value, 10);
        if (!isNaN(newPrice)) {
            newPrices.dates[dateStr] = newPrice;
        }
      }
      
      onPricesChange(newPrices);
  };
  
  const handleToggleDateClosed = (dateStr: string) => {
    const currentClosed = initialPrices.closedDates || [];
    const newPrices = { ...initialPrices, closedDates: [...currentClosed] };
    const index = newPrices.closedDates.indexOf(dateStr);
    
    if (index > -1) {
        // Date is currently closed, so open it
        newPrices.closedDates.splice(index, 1);
    } else {
        // Date is open, so close it
        newPrices.closedDates.push(dateStr);
    }
    onPricesChange(newPrices);
  };

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(<div key={`empty-start-${i}`} className="border border-gray-200 bg-gray-50"></div>);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = formatDateToYYYYMMDD(date);
    const dayOfWeek = date.getDay();
    // A "weekend night" is Friday night (5) or Saturday night (6).
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
    const placeholderPrice = isWeekend ? initialPrices.defaultWeekend : initialPrices.defaultWeekday;
    const specificPrice = initialPrices.dates[dateStr];
    const isClosed = initialPrices.closedDates?.includes(dateStr);

    calendarDays.push(
      <div key={day} className={`border border-gray-200 p-2 min-h-[110px] flex flex-col ${isClosed ? 'bg-gray-200' : ''}`}>
        <div className="font-semibold text-center mb-2">{day}</div>
        <div className="space-y-2 flex-grow">
            <div>
                <label htmlFor={`price-${dateStr}`} className="sr-only">Price for {dateStr}</label>
                <input
                    id={`price-${dateStr}`}
                    type="number"
                    value={specificPrice ?? ''}
                    placeholder={String(placeholderPrice)}
                    onChange={(e) => handleDatePriceChange(dateStr, e.target.value)}
                    className="w-full text-xs p-1 border rounded"
                    disabled={isClosed}
                />
            </div>
        </div>
        <button
            type="button"
            onClick={() => handleToggleDateClosed(dateStr)}
            className={`w-full text-xs p-1 mt-1 rounded text-white font-semibold transition-colors ${
                isClosed
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-red-500 hover:bg-red-600'
            }`}
        >
            {isClosed ? '開啟預訂' : '關閉預訂'}
        </button>
      </div>
    );
  }

  return (
    <div>
        <div className="mb-4 p-4 border rounded-lg bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-4">
            <h3 className="md:col-span-2 text-lg font-medium">預設價格</h3>
            <div>
                <label className="block text-sm font-medium text-gray-700">平日 (週日至四)</label>
                <input
                    type="number"
                    value={initialPrices.defaultWeekday}
                    onChange={(e) => handleDefaultPriceChange('defaultWeekday', e.target.value)}
                    className="mt-1 w-full p-2 border rounded"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">假日 (週五、六)</label>
                <input
                    type="number"
                    value={initialPrices.defaultWeekend}
                    onChange={(e) => handleDefaultPriceChange('defaultWeekend', e.target.value)}
                    className="mt-1 w-full p-2 border rounded"
                />
            </div>
            <div className="md:col-span-2 mt-2 pt-3 border-t">
                <p className="text-xs text-gray-600">
                  <strong className="font-semibold">計價規則說明：</strong> 系統會根據住宿的「夜晚」來決定價格。週五與週六的夜晚適用「假日價格」，週日至週四的夜晚則適用「平日價格」。
                </p>
            </div>
        </div>
        <div className="flex justify-between items-center mb-4">
            <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-200"><ChevronLeftIcon className="h-6 w-6" /></button>
            <h2 className="text-xl font-semibold">{year}年 {month + 1}月</h2>
            <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-200"><ChevronRightIcon className="h-6 w-6" /></button>
        </div>
        <div className="grid grid-cols-7">
            {['日', '一', '二', '三', '四', '五', '六'].map(d => <div key={d} className="text-center font-bold p-2">{d}</div>)}
            {calendarDays}
        </div>
    </div>
  );
};

export default PriceCalendar;