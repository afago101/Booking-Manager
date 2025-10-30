
// components/AdminBookingList.tsx

import React, { useState, useEffect } from 'react';
import { Booking } from '../types';
import { apiService } from '../services/apiService';
import EditBookingModal from './EditBookingModal';
import { PencilSquareIcon } from './icons';

interface AdminBookingListProps {
  onDataChange: () => void;
}

const AdminBookingList: React.FC<AdminBookingListProps> = ({ onDataChange }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getBookings();
      setBookings(data);
    } catch (err) {
      setError('無法載入訂單資料');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleEditSuccess = () => {
    setEditingBooking(null);
    fetchBookings();
    onDataChange();
  };
  
  const handleStatusChange = async (booking: Booking, newStatus: 'confirmed' | 'pending' | 'cancelled') => {
    const originalBookings = [...bookings];
    // Optimistic UI update
    setBookings(bookings.map(b => b.id === booking.id ? {...b, status: newStatus} : b));
    try {
        await apiService.updateBooking(booking.id, { ...booking, status: newStatus });
        onDataChange();
    } catch (err) {
        alert('狀態更新失敗!');
        setBookings(originalBookings); // Revert on failure
    }
  };

  if (isLoading) {
    return <div>讀取中...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">狀態</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">房客</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">入住/退房日期</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">總價</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">快速操作</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">編輯</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.length > 0 ? bookings.map((booking) => (
              <tr key={booking.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                        {booking.status === 'confirmed' ? '已確認' : booking.status === 'pending' ? '處理中' : '已取消'}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-700">{booking.guestName}</div>
                  <div className="text-sm text-gray-500">{booking.contactPhone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {booking.checkInDate} ~ {booking.checkOutDate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium"> {booking.totalPrice.toLocaleString()} 元</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    {booking.status === 'pending' && (
                        <button onClick={() => handleStatusChange(booking, 'confirmed')} className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">確認</button>
                    )}
                     {booking.status === 'confirmed' && (
                        <button onClick={() => handleStatusChange(booking, 'pending')} className="px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600">改為處理中</button>
                    )}
                    {booking.status !== 'cancelled' && (
                         <button onClick={() => handleStatusChange(booking, 'cancelled')} className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">取消</button>
                    )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => setEditingBooking(booking)} className="text-brand-primary hover:text-brand-dark">
                    <PencilSquareIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">沒有訂單資料</td>
              </tr>
            )}
          </tbody>
        </table>
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

export default AdminBookingList;
