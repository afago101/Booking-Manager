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

    const headers = rows[0];
    const bookings: Booking[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row[0]) continue; // Skip empty rows

      bookings.push({
        id: row[0] || '',
        guestName: row[1] || '',
        contactPhone: row[2] || '',
        lineName: row[3] || undefined,
        checkInDate: row[4] || '',
        checkOutDate: row[5] || '',
        numberOfGuests: parseInt(row[6]) || 0,
        useCoupon: row[7] === 'TRUE' || row[7] === true,
        arrivalTime: row[8] || undefined,
        totalPrice: parseFloat(row[9]) || 0,
        status: (row[10] || 'pending') as 'pending' | 'confirmed' | 'cancelled',
        createdAt: row[11] || new Date().toISOString(),
        updatedAt: row[12] || new Date().toISOString(),
      });
    }

    return bookings;
  }

  async createBooking(booking: Booking): Promise<void> {
    const row = [
      booking.id,
      booking.guestName,
      booking.contactPhone,
      booking.lineName || '',
      booking.checkInDate,
      booking.checkOutDate,
      booking.numberOfGuests,
      booking.useCoupon ? 'TRUE' : 'FALSE',
      booking.arrivalTime || '',
      booking.totalPrice,
      booking.status,
      booking.createdAt,
      booking.updatedAt,
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

    const row = [
      updated.id,
      updated.guestName,
      updated.contactPhone,
      updated.lineName || '',
      updated.checkInDate,
      updated.checkOutDate,
      updated.numberOfGuests,
      updated.useCoupon ? 'TRUE' : 'FALSE',
      updated.arrivalTime || '',
      updated.totalPrice,
      updated.status,
      updated.createdAt,
      updated.updatedAt,
    ];

    await this.updateRange(`Bookings!A${rowIndex}:M${rowIndex}`, [row]);
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
    // Clear the row
    await this.updateRange(`Bookings!A${rowIndex}:M${rowIndex}`, [['', '', '', '', '', '', '', '', '', '', '', '', '']]);
  }

  // === INVENTORY ===

  async getInventory(): Promise<Inventory[]> {
    const rows = await this.getSheetData('Inventory');
    if (rows.length <= 1) return [];

    const inventory: Inventory[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row[0]) continue;

      inventory.push({
        date: row[0],
        isClosed: row[1] === 'TRUE' || row[1] === true,
        capacity: parseInt(row[2]) || 1,
        note: row[3] || undefined,
      });
    }

    return inventory;
  }

  async updateInventory(date: string, data: Inventory): Promise<void> {
    const inventory = await this.getInventory();
    const index = inventory.findIndex(inv => inv.date === date);

    const row = [
      data.date,
      data.isClosed ? 'TRUE' : 'FALSE',
      data.capacity,
      data.note || '',
    ];

    if (index === -1) {
      // Create new
      await this.appendRows('Inventory', [row]);
    } else {
      // Update existing
      const rowIndex = index + 2;
      await this.updateRange(`Inventory!A${rowIndex}:D${rowIndex}`, [row]);
    }
  }

  // === SETTINGS ===

  async getSettings(): Promise<Setting[]> {
    const rows = await this.getSheetData('Settings');
    if (rows.length <= 1) return [];

    const settings: Setting[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row[0]) continue;

      settings.push({
        key: row[0],
        value: row[1] || '',
        updatedAt: row[2] || new Date().toISOString(),
      });
    }

    return settings;
  }

  async getSetting(key: string): Promise<string | null> {
    const settings = await this.getSettings();
    const setting = settings.find(s => s.key === key);
    return setting ? setting.value : null;
  }

  async updateSetting(key: string, value: string): Promise<void> {
    const settings = await this.getSettings();
    const index = settings.findIndex(s => s.key === key);

    const row = [key, value, new Date().toISOString()];

    if (index === -1) {
      await this.appendRows('Settings', [row]);
    } else {
      const rowIndex = index + 2;
      await this.updateRange(`Settings!A${rowIndex}:C${rowIndex}`, [row]);
    }
  }

  // === INITIALIZATION ===

  async initializeSheets(): Promise<void> {
    try {
      // Check if sheets exist, if not create them with headers
      const bookingsData = await this.getSheetData('Bookings').catch(() => []);
      if (bookingsData.length === 0) {
        await this.appendRows('Bookings', [[
          'id', 'guestName', 'contactPhone', 'lineName', 'checkInDate', 'checkOutDate',
          'numberOfGuests', 'useCoupon', 'arrivalTime', 'totalPrice', 'status', 'createdAt', 'updatedAt'
        ]]);
      }

      const inventoryData = await this.getSheetData('Inventory').catch(() => []);
      if (inventoryData.length === 0) {
        await this.appendRows('Inventory', [['date', 'isClosed', 'capacity', 'note']]);
      }

      const settingsData = await this.getSheetData('Settings').catch(() => []);
      if (settingsData.length === 0) {
        await this.appendRows('Settings', [['key', 'value', 'updatedAt']]);
        // Add default settings
        const now = new Date().toISOString();
        await this.appendRows('Settings', [
          ['nightlyPriceDefault', '5000', now],
          ['weekendPriceDefault', '7000', now],
          ['couponDiscount', '500', now],
          ['defaultCapacity', '1', now],
        ]);
      }
    } catch (error) {
      console.error('Error initializing sheets:', error);
    }
  }
}

