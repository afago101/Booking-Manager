// components/PriceSettingsModal.tsx

import React, { useState, useEffect } from 'react';
import { DailyPrices } from '../types';
import { apiService } from '../services/apiService';
import PriceCalendar from './PriceCalendar';

interface PriceSettingsModalProps {
  onClose: () => void;
}

const PriceSettingsModal: React.FC<PriceSettingsModalProps> = ({ onClose }) => {
  const [prices, setPrices] = useState<DailyPrices | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPrices = async () => {
      setIsLoading(true);
      try {
        const settings = await apiService.getPriceSettings();
        setPrices(settings);
      } catch (err) {
        setError('無法載入價格設定。');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPrices();
  }, []);

  const handleSave = async () => {
    if (!prices) return;
    setIsSaving(true);
    setError('');
    try {
      await apiService.updatePriceSettings(prices);
      onClose();
    } catch (err) {
      setError('儲存失敗，請再試一次。');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePriceChange = (newSettings: DailyPrices) => {
    setPrices(newSettings);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">房價設定</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>
        <div className="p-6 flex-grow overflow-y-auto">
          {isLoading && <div>讀取中...</div>}
          {error && <div className="text-red-500">{error}</div>}
          {prices && (
            <PriceCalendar
              initialPrices={prices}
              onPricesChange={handlePriceChange}
            />
          )}
        </div>
        <div className="p-4 bg-gray-50 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-md hover:bg-brand-dark disabled:bg-gray-400"
          >
            {isSaving ? '儲存中...' : '儲存設定'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PriceSettingsModal;
