// Google Sheets API integration

import { Booking, Inventory, Setting, CustomerProfile, Coupon } from '../types';
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

      // 對應 Bookings 表頭順序：id, guestName, contactPhone, email, lineName, lineUserId, checkInDate, checkOutDate, 
      // numberOfGuests, totalPrice, useCoupon, couponCode, arrivalTime, status, createdAt
      bookings.push({
        id: row[0] || '',
        guestName: row[1] || '',
        contactPhone: (row[2] || '').toString().replace(/^'/, '').trim(), // 去除前導撇號與空格
        email: row[3] || '',
        lineName: row[4] || undefined,
        lineUserId: row[5] || undefined,
        checkInDate: row[6] || '',
        checkOutDate: row[7] || '',
        numberOfGuests: parseInt(row[8]) || 0,
        totalPrice: parseFloat(row[9]) || 0,
        useCoupon: row[10] === 'TRUE' || row[10] === true,
        couponCode: row[11] || undefined,
        arrivalTime: row[12] || undefined,
        status: (row[13] || 'pending') as 'pending' | 'confirmed' | 'cancelled',
        createdAt: row[14] || new Date().toISOString(),
        updatedAt: row[14] || new Date().toISOString(), // 使用 createdAt 作為 updatedAt
      });
    }

    return bookings;
  }

  async createBooking(booking: Booking): Promise<void> {
    // 對應 Bookings 表頭順序：id, guestName, contactPhone, email, lineName, lineUserId, checkInDate, checkOutDate, 
    // numberOfGuests, totalPrice, useCoupon, couponCode, arrivalTime, status, createdAt
    // 手機號碼保留前導0：使用前導撇號讓 Google Sheets 以文字儲存
    const phoneNumber = booking.contactPhone.startsWith('0') && !booking.contactPhone.startsWith("'")
      ? `'${booking.contactPhone}`  // 如果以0開頭且沒有撇號，就加上撇號
      : booking.contactPhone;
    
    const row = [
      booking.id,
      booking.guestName,
      phoneNumber,
      booking.email || '',
      booking.lineName || '',
      booking.lineUserId || '',
      booking.checkInDate,
      booking.checkOutDate,
      booking.numberOfGuests,
      booking.totalPrice,
      booking.useCoupon ? 'TRUE' : 'FALSE',
      booking.couponCode || '',
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

    // 對應 Bookings 表頭順序：id, guestName, contactPhone, email, lineName, lineUserId, checkInDate, checkOutDate, 
    // numberOfGuests, totalPrice, useCoupon, couponCode, arrivalTime, status, createdAt
    const phoneNumber = updated.contactPhone && updated.contactPhone.startsWith('0') && !updated.contactPhone.startsWith("'")
      ? `'${updated.contactPhone}`
      : updated.contactPhone;
    
    const row = [
      updated.id,
      updated.guestName,
      phoneNumber,
      updated.email || '',
      updated.lineName || '',
      updated.lineUserId || '',
      updated.checkInDate,
      updated.checkOutDate,
      updated.numberOfGuests,
      updated.totalPrice,
      updated.useCoupon ? 'TRUE' : 'FALSE',
      updated.couponCode || '',
      updated.arrivalTime || '',
      updated.status,
      updated.createdAt,
    ];

    await this.updateRange(`Bookings!A${rowIndex}:O${rowIndex}`, [row]);
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
    // Clear the row (15 columns)
    await this.updateRange(`Bookings!A${rowIndex}:O${rowIndex}`, [['', '', '', '', '', '', '', '', '', '', '', '', '', '', '']]);
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

  // === CUSTOMER PROFILES ===

  async getCustomerProfiles(): Promise<CustomerProfile[]> {
    const rows = await this.getSheetData('Customer_Profile');
    if (rows.length <= 1) return [];

    const profiles: CustomerProfile[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row[0]) continue;

      profiles.push({
        lineUserId: row[0] || '',
        guestName: row[1] || '',
        contactPhone: row[2] || '',
        email: row[3] || undefined,
        lineName: row[4] || undefined,
        totalNights: parseInt(row[5]) || 0,
        totalBookings: parseInt(row[6]) || 0,
        createdAt: row[7] || new Date().toISOString(),
        updatedAt: row[8] || new Date().toISOString(),
      });
    }

    return profiles;
  }

  async getCustomerProfile(lineUserId: string): Promise<CustomerProfile | null> {
    const profiles = await this.getCustomerProfiles();
    return profiles.find(p => p.lineUserId === lineUserId) || null;
  }

  async createOrUpdateCustomerProfile(profile: CustomerProfile): Promise<void> {
    const profiles = await this.getCustomerProfiles();
    const index = profiles.findIndex(p => p.lineUserId === profile.lineUserId);

    const phoneNumber = profile.contactPhone.startsWith('0') && !profile.contactPhone.startsWith("'")
      ? `'${profile.contactPhone}`
      : profile.contactPhone;

    const row = [
      profile.lineUserId,
      profile.guestName,
      phoneNumber,
      profile.email || '',
      profile.lineName || '',
      profile.totalNights,
      profile.totalBookings,
      profile.createdAt,
      new Date().toISOString(), // updatedAt
    ];

    if (index === -1) {
      await this.appendRows('Customer_Profile', [row]);
    } else {
      const rowIndex = index + 2;
      await this.updateRange(`Customer_Profile!A${rowIndex}:I${rowIndex}`, [row]);
    }
  }

  // === COUPONS ===

  async getCoupons(lineUserId?: string): Promise<Coupon[]> {
    const rows = await this.getSheetData('Coupons');
    if (rows.length <= 1) return [];

    const coupons: Coupon[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row[0]) continue;

      const coupon: Coupon = {
        id: row[0] || '',
        couponCode: row[1] || '',
        type: (row[2] || 'stay_discount') as 'stay_discount' | 'free_night',
        lineUserId: row[3] || '',
        status: (row[4] || 'active') as 'active' | 'used' | 'expired',
        value: parseFloat(row[5]) || 0,
        minNights: row[6] ? parseInt(row[6]) : undefined,
        createdAt: row[7] || new Date().toISOString(),
        usedAt: row[8] || undefined,
        expiresAt: row[9] || undefined,
      };

      if (!lineUserId || coupon.lineUserId === lineUserId) {
        coupons.push(coupon);
      }
    }

    return coupons;
  }

  async createCoupon(coupon: Coupon): Promise<void> {
    const row = [
      coupon.id,
      coupon.couponCode,
      coupon.type,
      coupon.lineUserId,
      coupon.status,
      coupon.value,
      coupon.minNights || '',
      coupon.createdAt,
      coupon.usedAt || '',
      coupon.expiresAt || '',
    ];

    await this.appendRows('Coupons', [row]);
  }

  async updateCoupon(couponId: string, updates: Partial<Coupon>): Promise<void> {
    const rows = await this.getSheetData('Coupons');
    const index = rows.findIndex((row, i) => i > 0 && row[0] === couponId);

    if (index === -1) {
      throw new Error('Coupon not found');
    }

    const existing = rows[index];
    const updated: Coupon = {
      id: existing[0],
      couponCode: existing[1],
      type: existing[2] as 'stay_discount' | 'free_night',
      lineUserId: existing[3],
      status: (updates.status || existing[4]) as 'active' | 'used' | 'expired',
      value: parseFloat(existing[5]) || 0,
      minNights: existing[6] ? parseInt(existing[6]) : undefined,
      createdAt: existing[7],
      usedAt: updates.usedAt || existing[8] || undefined,
      expiresAt: updates.expiresAt || existing[9] || undefined,
      ...updates,
    };

    const rowIndex = index + 1;
    const row = [
      updated.id,
      updated.couponCode,
      updated.type,
      updated.lineUserId,
      updated.status,
      updated.value,
      updated.minNights || '',
      updated.createdAt,
      updated.usedAt || '',
      updated.expiresAt || '',
    ];

    await this.updateRange(`Coupons!A${rowIndex}:J${rowIndex}`, [row]);
  }

  // === INITIALIZATION ===

  async initializeSheets(): Promise<void> {
    try {
      // Check if sheets exist, if not create them with headers
      const bookingsData = await this.getSheetData('Bookings').catch(() => []);
      if (bookingsData.length === 0) {
        await this.appendRows('Bookings', [[
          'id', 'guestName', 'contactPhone', 'email', 'lineName', 'lineUserId', 'checkInDate', 'checkOutDate', 
          'numberOfGuests', 'totalPrice', 'useCoupon', 'couponCode', 'arrivalTime', 'status', 'createdAt'
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

      // Initialize Customer_Profile sheet
      const customerData = await this.getSheetData('Customer_Profile').catch(() => []);
      if (customerData.length === 0) {
        await this.appendRows('Customer_Profile', [[
          'lineUserId', 'guestName', 'contactPhone', 'email', 'lineName', 
          'totalNights', 'totalBookings', 'createdAt', 'updatedAt'
        ]]);
      }

      // Initialize Coupons sheet
      const couponsData = await this.getSheetData('Coupons').catch(() => []);
      if (couponsData.length === 0) {
        await this.appendRows('Coupons', [[
          'id', 'couponCode', 'type', 'lineUserId', 'status', 
          'value', 'minNights', 'createdAt', 'usedAt', 'expiresAt'
        ]]);
      }
    } catch (error) {
      console.error('Error initializing sheets:', error);
    }
  }
}


