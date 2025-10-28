// components/EditBookingModal.tsx

import React, { useState } from 'react';
import { Booking } from '../types';
import { apiService } from '../services/apiService';

interface EditBookingModalProps {
  booking: Booking;
  onClose: () => void;
  onSuccess: () => void;
}

const EditBookingModal: React.FC<EditBookingModalProps> = ({ booking, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<Booking>(booking);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({
            ...prev,
            [name]: name === 'numberOfGuests' || name === 'totalPrice' ? Number(value) : value,
        }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      await apiService.updateBooking(booking.id, formData);
      onSuccess();
    } catch (err) {
      setError('更新失敗，請再試一次。');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDelete = async () => {
    if (window.confirm(`確定要刪除 ${booking.guestName} 的訂單嗎？此操作無法復原。`)) {
        setIsSaving(true);
        setError('');
        try {
            await apiService.deleteBooking(booking.id);
            onSuccess();
        } catch (err) {
            setError('刪除失敗，請再試一次。');
        } finally {
            setIsSaving(false);
        }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold">編輯訂單</h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="guestName" className="block text-sm font-medium text-gray-700">房客姓名</label>
                <input type="text" name="guestName" id="guestName" value={formData.guestName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
              </div>
              <div>
                <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">聯絡電話</label>
                <input type="tel" name="contactPhone" id="contactPhone" value={formData.contactPhone} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
              </div>
              <div className="md:col-span-2">
                <label htmlFor="lineName" className="block text-sm font-medium text-gray-700">LINE 名稱</label>
                <input type="text" name="lineName" id="lineName" value={formData.lineName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
              </div>
              <div>
                <label htmlFor="checkInDate" className="block text-sm font-medium text-gray-700">入住日期</label>
                <input type="date" name="checkInDate" id="checkInDate" value={formData.checkInDate} readOnly className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"/>
              </div>
              <div>
                <label htmlFor="checkOutDate" className="block text-sm font-medium text-gray-700">退房日期</label>
                <input type="date" name="checkOutDate" id="checkOutDate" value={formData.checkOutDate} readOnly className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"/>
              </div>
               <div>
                <label htmlFor="numberOfGuests" className="block text-sm font-medium text-gray-700">人數</label>
                <input type="number" name="numberOfGuests" id="numberOfGuests" value={formData.numberOfGuests} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
              </div>
              <div>
                 <label htmlFor="arrivalTime" className="block text-sm font-medium text-gray-700">抵達時間</label>
                <input type="time" name="arrivalTime" id="arrivalTime" value={formData.arrivalTime} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
              </div>
               <div>
                <label htmlFor="totalPrice" className="block text-sm font-medium text-gray-700">總價</label>
                <input type="number" name="totalPrice" id="totalPrice" value={formData.totalPrice} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">訂單狀態</label>
                <select name="status" id="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
                    <option value="pending">處理中</option>
                    <option value="confirmed">已確認</option>
                    <option value="cancelled">已取消</option>
                </select>
              </div>
               <div className="md:col-span-2 flex items-center">
                    <input type="checkbox" name="useCoupon" id="useCoupon" checked={formData.useCoupon} onChange={handleChange} className="form-checkbox h-4 w-4" />
                    <label htmlFor="useCoupon" className="ml-2 block text-sm text-gray-900">使用優惠券</label>
               </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
          <div className="p-4 bg-gray-50 flex justify-between">
             <button
              type="button"
              onClick={handleDelete}
              disabled={isSaving}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:bg-red-300"
            >
              刪除訂單
            </button>
            <div className="flex justify-end gap-2">
                <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
                >
                取消
                </button>
                <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-md hover:bg-brand-dark disabled:bg-gray-400"
                >
                {isSaving ? '儲存中...' : '儲存變更'}
                </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBookingModal;
