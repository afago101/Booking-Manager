// services/mockDb.ts
// This file acts as a mock database using the browser's localStorage.

import { Booking, DailyPrices } from '../types';
import { getDatesInRange } from '../utils/dateUtils';

const DB_KEY = 'blessingBayDb';

interface DbData {
  bookings: Booking[];
  prices: DailyPrices;
  adminPassword: string;
  notificationEmails: string[];
}

const getInitialData = (): DbData => ({
  bookings: [],
  prices: {
    defaultWeekday: 5000,
    defaultWeekend: 7000,
    dates: {},
    closedDates: [],
  },
  adminPassword: 'password123', // A default password
  notificationEmails: [],
});

const readDb = (): DbData => {
  try {
    const data = localStorage.getItem(DB_KEY);
    if (!data) {
      const initialData = getInitialData();
      localStorage.setItem(DB_KEY, JSON.stringify(initialData));
      return initialData;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to read from mock DB, returning initial data.", error);
    return getInitialData();
  }
};

const writeDb = (data: DbData): void => {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
};

// --- Exported DB Functions ---

export const db = {
  getBookings: (): Booking[] => {
    const data = readDb();
    return data.bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  
  createBooking: (bookingData: Omit<Booking, 'id' | 'createdAt' | 'status'>): Booking => {
    const data = readDb();
    const newBooking: Booking = {
      id: `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
      ...bookingData,
    };
    data.bookings.push(newBooking);
    writeDb(data);
    return newBooking;
  },

  updateBooking: (id: string, updatedData: Booking): Booking => {
    const data = readDb();
    const index = data.bookings.findIndex(b => b.id === id);
    if (index === -1) {
      throw new Error("Booking not found");
    }
    data.bookings[index] = updatedData;
    writeDb(data);
    return updatedData;
  },

  deleteBooking: (id: string): void => {
    const data = readDb();
    data.bookings = data.bookings.filter(b => b.id !== id);
    writeDb(data);
  },
  
  getUnavailableDates: (): string[] => {
    const data = readDb();
    const bookedDates = new Set<string>();
    data.bookings.forEach(booking => {
        if (booking.status === 'cancelled') return;
        const dates = getDatesInRange(new Date(booking.checkInDate), new Date(booking.checkOutDate));
        dates.forEach(date => bookedDates.add(date));
    });
    const closedDates = data.prices.closedDates || [];
    return [...Array.from(bookedDates), ...closedDates];
  },
  
  getPriceSettings: (): DailyPrices => {
      const data = readDb();
      return data.prices;
  },
  
  updatePriceSettings: (settings: DailyPrices): DailyPrices => {
      const data = readDb();
      data.prices = settings;
      writeDb(data);
      return settings;
  },
  
  getBookingsByPhone: (phone: string): Booking[] => {
      const data = readDb();
      return data.bookings.filter(b => b.contactPhone === phone);
  },
  
  login: (password: string): boolean => {
      const data = readDb();
      return password === data.adminPassword;
  },
  
  updateAdminPassword: (currentPassword: string, newPassword: string): void => {
      const data = readDb();
      if (currentPassword !== data.adminPassword) {
          throw new Error('目前密碼錯誤。');
      }
      if (!newPassword || newPassword.length < 6) {
          throw new Error('新密碼長度至少需要6個字元。');
      }
      data.adminPassword = newPassword;
      writeDb(data);
  },
  
  getNotificationEmails: (): string[] => {
      const data = readDb();
      return data.notificationEmails;
  },
  
  updateNotificationEmails: (emails: string[]): void => {
      const data = readDb();
      data.notificationEmails = emails;
      writeDb(data);
  }
};
