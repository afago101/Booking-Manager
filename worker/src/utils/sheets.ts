// Google Sheets API integration

import { Booking, Inventory, Setting } from '../types';
import { getGoogleAccessToken } from './jwt';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

export class SheetsService {
  private spreadsheetId: string;
  private clientEmail: string;
  private privateKey: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(spreadsheetId: string, clientEmail: string, privateKey: string) {
    this.spreadsheetId = spreadsheetId;
    this.clientEmail = clientEmail;
    this.privateKey = privateKey;
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.accessToken && this.tokenExpiry > now + 60000) {
      return this.accessToken;
    }

    this.accessToken = await getGoogleAccessToken(this.clientEmail, this.privateKey);
    this.tokenExpiry = now + 3500000; // ~58 minutes
    return this.accessToken;
  }

  private async fetchSheet(method: string, path: string, body?: any): Promise<any> {
    const token = await this.getAccessToken();
    const url = `${SHEETS_API_BASE}/${this.spreadsheetId}${path}`;

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Sheets API error: ${response.status} ${error}`);
    }

    return response.json();
  }

  // Read all rows from a sheet
  async getSheetData(sheetName: string): Promise<any[][]> {
    const range = `${sheetName}!A:Z`;
    const data = await this.fetchSheet('GET', `/values/${encodeURIComponent(range)}`);
    return data.values || [];
  }

  // Append rows to a sheet
  async appendRows(sheetName: string, rows: any[][]): Promise<void> {
    const range = `${sheetName}!A:Z`;
    await this.fetchSheet('POST', `/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`, {
      values: rows,
    });
  }

  // Update specific cells
  async updateRange(range: string, values: any[][]): Promise<void> {
    await this.fetchSheet('PUT', `/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, {
      values,
    });
  }

  // Batch update multiple ranges
  async batchUpdate(data: Array<{ range: string; values: any[][] }>): Promise<void> {
    await this.fetchSheet('POST', '/values:batchUpdate', {
      valueInputOption: 'USER_ENTERED',
      data,
    });
  }

  // === BOOKINGS ===

  async getBookings(): Promise<Booking[]> {
    const rows = await this.getSheetData('Bookings');
    if (rows.length <= 1) return []; // No data or only headers

    const bookings: Booking[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row[0]) continue; // Skip empty rows

      // 對應 Bookings 表頭順序：id, guestName, checkInDate, checkOutDate, numberOfGuests, 
      // totalPrice, contactPhone, lineName, useCoupon, arrivalTime, status, createdAt
      bookings.push({
        id: row[0] || '',
        guestName: row[1] || '',
        checkInDate: row[2] || '',
        checkOutDate: row[3] || '',
        numberOfGuests: parseInt(row[4]) || 0,
        totalPrice: parseFloat(row[5]) || 0,
        contactPhone: row[6] || '',
        lineName: row[7] || undefined,
        useCoupon: row[8] === 'TRUE' || row[8] === true,
        arrivalTime: row[9] || undefined,
        status: (row[10] || 'pending') as 'pending' | 'confirmed' | 'cancelled',
        createdAt: row[11] || new Date().toISOString(),
        updatedAt: row[11] || new Date().toISOString(), // 使用 createdAt 作為 updatedAt
      });
    }

    return bookings;
  }

  async createBooking(booking: Booking): Promise<void> {
    // 對應 Bookings 表頭順序
    const row = [
      booking.id,
      booking.guestName,
      booking.checkInDate,
      booking.checkOutDate,
      booking.numberOfGuests,
      booking.totalPrice,
      booking.contactPhone,
      booking.lineName || '',
      booking.useCoupon ? 'TRUE' : 'FALSE',
      booking.arrivalTime || '',
      booking.status,
      booking.createdAt,
    ];

    await this.appendRows('Bookings', [row]);
  }

  async updateBooking(bookingId: string, updates: Partial<Booking>, expectedUpdatedAt: string): Promise<void> {
    const bookings = await this.getBookings();
    const index = bookings.findIndex(b => b.id === bookingId);

    if (index === -1) {
      throw new Error('Booking not found');
    }

    const existing = bookings[index];

    // Optimistic locking check
    if (existing.updatedAt !== expectedUpdatedAt) {
      throw new Error('CONFLICT: Booking has been modified by another request');
    }

    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    const rowIndex = index + 2; // +1 for header, +1 for 1-based indexing

    // 對應 Bookings 表頭順序
    const row = [
      updated.id,
      updated.guestName,
      updated.checkInDate,
      updated.checkOutDate,
      updated.numberOfGuests,
      updated.totalPrice,
      updated.contactPhone,
      updated.lineName || '',
      updated.useCoupon ? 'TRUE' : 'FALSE',
      updated.arrivalTime || '',
      updated.status,
      updated.createdAt,
    ];

    await this.updateRange(`Bookings!A${rowIndex}:L${rowIndex}`, [row]);
  }

  async deleteBooking(bookingId: string): Promise<void> {
    // Note: Google Sheets API doesn't have a simple "delete row" method
    // We'll set all fields to empty or mark as deleted
    // For production, consider using batchUpdate with DeleteDimensionRequest
    const bookings = await this.getBookings();
    const index = bookings.findIndex(b => b.id === bookingId);

    if (index === -1) {
      throw new Error('Booking not found');
    }

    const rowIndex = index + 2;
    // Clear the row (12 columns)
    await this.updateRange(`Bookings!A${rowIndex}:L${rowIndex}`, [['', '', '', '', '', '', '', '', '', '', '', '']]);
  }

  // === PRICES (對應 Prices 工作表) ===

  async getPrices(): Promise<Array<{date: string; price: number; isClosed: boolean}>> {
    const rows = await this.getSheetData('Prices');
    if (rows.length <= 1) return [];

    const prices: Array<{date: string; price: number; isClosed: boolean}> = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row[0]) continue;

      prices.push({
        date: row[0],
        price: parseFloat(row[1]) || 0,
        isClosed: row[2] === 'TRUE' || row[2] === true,
      });
    }

    return prices;
  }

  async updatePrice(date: string, price: number, isClosed: boolean): Promise<void> {
    const prices = await this.getPrices();
    const index = prices.findIndex(p => p.date === date);

    const row = [date, price, isClosed ? 'TRUE' : 'FALSE'];

    if (index === -1) {
      await this.appendRows('Prices', [row]);
    } else {
      const rowIndex = index + 2;
      await this.updateRange(`Prices!A${rowIndex}:C${rowIndex}`, [row]);
    }
  }

  // 為了向後相容，保留 Inventory 介面
  async getInventory(): Promise<Inventory[]> {
    const prices = await this.getPrices();
    return prices.map(p => ({
      date: p.date,
      isClosed: p.isClosed,
      capacity: 1, // 預設容量為 1
      note: undefined,
    }));
  }

  async updateInventory(date: string, data: Inventory): Promise<void> {
    // 轉換為 Prices 格式
    const defaultPrice = parseFloat(await this.getSetting('defaultWeekday') || '5000');
    await this.updatePrice(date, defaultPrice, data.isClosed);
  }

  // === CONFIG (對應 config 工作表) ===

  async getConfig(): Promise<Array<{key: string; value: string}>> {
    const rows = await this.getSheetData('config');
    if (rows.length <= 1) return [];

    const config: Array<{key: string; value: string}> = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row[0]) continue;

      config.push({
        key: row[0],
        value: row[1] || '',
      });
    }

    return config;
  }

  async getConfigValue(key: string): Promise<string | null> {
    const config = await this.getConfig();
    const item = config.find(c => c.key === key);
    return item ? item.value : null;
  }

  async updateConfig(key: string, value: string): Promise<void> {
    const config = await this.getConfig();
    const index = config.findIndex(c => c.key === key);

    const row = [key, value];

    if (index === -1) {
      await this.appendRows('config', [row]);
    } else {
      const rowIndex = index + 2;
      await this.updateRange(`config!A${rowIndex}:B${rowIndex}`, [row]);
    }
  }

  // 為了向後相容，保留 Settings 介面
  async getSettings(): Promise<Setting[]> {
    const config = await this.getConfig();
    return config.map(c => ({
      key: c.key,
      value: c.value,
      updatedAt: new Date().toISOString(),
    }));
  }

  async getSetting(key: string): Promise<string | null> {
    return this.getConfigValue(key);
  }

  async updateSetting(key: string, value: string): Promise<void> {
    return this.updateConfig(key, value);
  }

  // === INITIALIZATION ===

  async initializeSheets(): Promise<void> {
    try {
      // Check if sheets exist, if not create them with headers
      const bookingsData = await this.getSheetData('Bookings').catch(() => []);
      if (bookingsData.length === 0) {
        await this.appendRows('Bookings', [[
          'id', 'guestName', 'checkInDate', 'checkOutDate', 'numberOfGuests', 
          'totalPrice', 'contactPhone', 'lineName', 'useCoupon', 'arrivalTime', 
          'status', 'createdAt'
        ]]);
      }

      const pricesData = await this.getSheetData('Prices').catch(() => []);
      if (pricesData.length === 0) {
        await this.appendRows('Prices', [['date', 'price', 'isClosed']]);
      }

      const configData = await this.getSheetData('config').catch(() => []);
      if (configData.length === 0) {
        await this.appendRows('config', [['key', 'value']]);
        // Add default config
        await this.appendRows('config', [
          ['adminPassword', '40lVHrWkepi2cOwZq7U19vIgNFaDoRXL'],
          ['nightlyPriceDefault', '2890'],
          ['weekendPriceDefault', '4000'],
          ['defaultWeekday', '5000'],
          ['defaultWeekend', '7000'],
          ['closedDates', '[]'],
          ['notificationEmails', '[]'],
          ['emailApiKey', ''],
          ['emailFrom', 'noreply@yourdomain.com'],
          ['emailFromName', '訂房系統'],
        ]);
      }
    } catch (error) {
      console.error('Error initializing sheets:', error);
    }
  }
}


