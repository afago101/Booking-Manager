// components/AdminCalendarView.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { Booking } from '../types';
import { apiService } from '../services/apiService';
import { formatDateToYYYYMMDD } from '../utils/dateUtils';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import EditBookingModal from './EditBookingModal';

interface AdminCalendarViewProps {
  onDataChange: () => void;
}

const BOOKING_COLOR = 'bg-blue-200 border-blue-400 text-blue-800';

const AdminCalendarView: React.FC<AdminCalendarViewProps> = ({ onDataChange }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      try {
        const data = await apiService.getBookings();
        setBookings(data.filter(b => b.status !== 'cancelled')); // Don't show cancelled bookings on calendar
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookings();
  }, []);
  
  const handleEditSuccess = () => {
    setEditingBooking(null);
    // Refetch bookings to show updated data
    apiService.getBookings().then(data => setBookings(data.filter(b => b.status !== 'cancelled')));
    onDataChange();
  };

  const { month, year, daysInMonth, firstDayOfMonth } = useMemo(() => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    return { month, year, daysInMonth, firstDayOfMonth };
  }, [currentDate]);
  
  const changeMonth = (offset: number) => {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };
  
  const bookingsByDate = useMemo(() => {
      const map = new Map<string, Booking[]>();
      bookings.forEach(booking => {
          const checkInParts = booking.checkInDate.split('-').map(Number);
          const checkOutParts = booking.checkOutDate.split('-').map(Number);

          let d = new Date(checkInParts[0], checkInParts[1] - 1, checkInParts[2]);
          const end = new Date(checkOutParts[0], checkOutParts[1] - 1, checkOutParts[2]);
          
          while(d < end) {
              const dateStr = formatDateToYYYYMMDD(d);
              const dayBookings = map.get(dateStr) || [];
              map.set(dateStr, [...dayBookings, booking]);
              d.setDate(d.getDate() + 1);
          }
      });
      return map;
  }, [bookings]);

  const calendarDays = [];
  // Fill empty days at the start of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(<div key={`empty-start-${i}`} className="border border-gray-200 bg-gray-50"></div>);
  }
  // Fill days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = formatDateToYYYYMMDD(date);
    const dayBookings = bookingsByDate.get(dateStr) || [];
    calendarDays.push(
      <div key={day} className="border border-gray-200 p-2 min-h-[100px]">
        <div className="font-semibold">{day}</div>
        <div className="space-y-1 mt-1">
            {dayBookings.map(b => (
                <div key={b.id} onClick={() => setEditingBooking(b)} className={`text-xs p-1 rounded border cursor-pointer ${BOOKING_COLOR}`}>
                    {b.guestName}
                </div>
            ))}
        </div>
      </div>
    );
  }

  return (
      <>
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-200"><ChevronLeftIcon className="h-6 w-6" /></button>
          <h2 className="text-xl font-semibold">{year}年 {month + 1}月</h2>
          <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-200"><ChevronRightIcon className="h-6 w-6" /></button>
        </div>
        <div className="grid grid-cols-7">
            {['日', '一', '二', '三', '四', '五', '六'].map(d => <div key={d} className="text-center font-bold p-2">{d}</div>)}
            {calendarDays}
        </div>
        {editingBooking && (
            <EditBookingModal
            booking={editingBooking}
            onClose={() => setEditingBooking(null)}
            onSuccess={handleEditSuccess}
            />
        )}
     </>
  );
};

export default AdminCalendarView;