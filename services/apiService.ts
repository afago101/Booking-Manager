// services/apiService.ts - Updated to use new REST API

import {
  Booking,
  AvailabilityDay,
  QuoteRequest,
  QuoteResponse,
  BookingCreateRequest,
  BookingUpdateRequest,
  InventoryUpdateRequest,
  Setting,
  Inventory,
  ApiError,
} from '../types';

// Base URL for API - can be configured via environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class ApiService {
  private adminPassword: string | null = null;

  // 設定當前登入的管理員密碼
  setAdminPassword(password: string): void {
    this.adminPassword = password;
    // 持久化到 sessionStorage
    sessionStorage.setItem('adminPassword', password);
  }

  // 取得當前的管理員密碼
  getAdminPassword(): string {
    if (!this.adminPassword) {
      // 從 sessionStorage 恢復
      this.adminPassword = sessionStorage.getItem('adminPassword') || 
                          import.meta.env.VITE_ADMIN_API_KEY || '';
    }
    return this.adminPassword;
  }

  // 清除管理員密碼
  clearAdminPassword(): void {
    this.adminPassword = null;
    sessionStorage.removeItem('adminPassword');
  }

  private async fetchAPI<T>(
    endpoint: string,
    options: RequestInit = {},
    isAdmin: boolean = false
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (isAdmin) {
      const adminKey = this.getAdminPassword();
      if (adminKey) {
        headers['x-admin-key'] = adminKey;
      }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let error: ApiError;
      try {
        error = await response.json();
      } catch {
        error = {
          error: `HTTP ${response.status}: ${response.statusText}`,
          code: 'INTERNAL_ERROR',
        };
      }

      if (error.code === 'CONFLICT') {
            throw new Error('DATE_CONFLICT');
        }

      throw new Error(error.error || 'An error occurred');
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // === PUBLIC ENDPOINTS ===

  async getAvailability(from: string, to: string): Promise<AvailabilityDay[]> {
    return this.fetchAPI<AvailabilityDay[]>(`/availability?from=${from}&to=${to}`);
  }

  async getQuote(request: QuoteRequest): Promise<QuoteResponse> {
    return this.fetchAPI<QuoteResponse>('/quote', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async createBooking(request: BookingCreateRequest): Promise<{ id: string; status: string }> {
    return this.fetchAPI<{ id: string; status: string }>('/bookings', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // === ADMIN ENDPOINTS ===

  async getBookings(params?: {
    from?: string;
    to?: string;
    status?: 'pending' | 'confirmed' | 'cancelled';
  }): Promise<Booking[]> {
    let endpoint = '/admin/bookings';
    const queryParams: string[] = [];

    if (params?.from) queryParams.push(`from=${params.from}`);
    if (params?.to) queryParams.push(`to=${params.to}`);
    if (params?.status) queryParams.push(`status=${params.status}`);

    if (queryParams.length > 0) {
      endpoint += `?${queryParams.join('&')}`;
    }

    return this.fetchAPI<Booking[]>(endpoint, {}, true);
  }

  async updateBooking(id: string, updates: BookingUpdateRequest): Promise<Booking> {
    return this.fetchAPI<Booking>(`/admin/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }, true);
  }

  async deleteBooking(id: string): Promise<void> {
    await this.fetchAPI<void>(`/admin/bookings/${id}`, {
      method: 'DELETE',
    }, true);
  }

  async getInventory(from?: string, to?: string): Promise<Inventory[]> {
    let endpoint = '/admin/inventory';
    if (from && to) {
      endpoint += `?from=${from}&to=${to}`;
    }
    return this.fetchAPI<Inventory[]>(endpoint, {}, true);
  }

  async updateInventory(date: string, data: InventoryUpdateRequest): Promise<Inventory> {
    return this.fetchAPI<Inventory>(`/admin/inventory/${date}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, true);
  }

  async getSettings(): Promise<Record<string, string>> {
    return this.fetchAPI<Record<string, string>>('/admin/settings', {}, true);
  }

  async updateSetting(key: string, value: string): Promise<Setting> {
    return this.fetchAPI<Setting>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({ key, value }),
    }, true);
  }

  // === BACKWARD COMPATIBILITY (for existing code) ===

  async getUnavailableDates(): Promise<string[]> {
    try {
      // Get availability for next 12 months
      const from = new Date().toISOString().split('T')[0];
      const to = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const availability = await this.getAvailability(from, to);
      return availability
        .filter(day => !day.available)
        .map(day => day.date);
    } catch (error) {
      console.error('Error getting unavailable dates:', error);
      return [];
    }
  }

  async getBookingsByPhone(phone: string): Promise<Booking[]> {
    // Since we don't have a specific endpoint for this, filter on client side
    const bookings = await this.getBookings();
    return bookings.filter(b => b.contactPhone === phone);
  }

  // Admin password management
  async login(password: string): Promise<boolean> {
    try {
      // 臨時設定密碼
      this.setAdminPassword(password);
      
      // 嘗試調用 admin API 來驗證密碼
      await this.getBookings();
      
      // 如果成功，密碼正確
      return true;
    } catch (error) {
      // 驗證失敗，清除密碼
      this.clearAdminPassword();
      return false;
    }
  }

  async updateAdminPassword(currentPassword: string, newPassword: string): Promise<void> {
    // 驗證當前密碼
    const savedPassword = this.getAdminPassword();
    if (currentPassword !== savedPassword) {
      throw new Error('目前密碼不正確');
    }
    
    // 更新 Google Sheets 中的 adminPassword
    await this.updateSetting('adminPassword', newPassword);
    
    // 自動更新本地存儲的密碼
    this.setAdminPassword(newPassword);
  }

  // Notification emails (if needed)
  async getNotificationEmails(): Promise<string[]> {
    try {
      const settings = await this.getSettings();
      const emails = settings['notificationEmails'];
      return emails ? JSON.parse(emails) : [];
    } catch {
      return [];
    }
  }

  async updateNotificationEmails(emails: string[]): Promise<void> {
    await this.updateSetting('notificationEmails', JSON.stringify(emails));
  }

  // Price settings backward compatibility
  async getPriceSettings(): Promise<any> {
    const settings = await this.getSettings();
    const closedDatesStr = settings['closedDates'] || '[]';
    let closedDates: string[] = [];
    try {
      closedDates = JSON.parse(closedDatesStr);
    } catch {
      closedDates = [];
    }
    
    return {
      defaultWeekday: parseFloat(settings['nightlyPriceDefault'] || '5000'),
      defaultWeekend: parseFloat(settings['weekendPriceDefault'] || '7000'),
      dates: {},
      closedDates: closedDates,
    };
  }

  async updatePriceSettings(settings: any): Promise<any> {
    await this.updateSetting('nightlyPriceDefault', settings.defaultWeekday.toString());
    await this.updateSetting('weekendPriceDefault', settings.defaultWeekend.toString());
    
    // 更新關閉的日期列表
    if (settings.closedDates) {
      await this.updateSetting('closedDates', JSON.stringify(settings.closedDates));
    }
    
    return settings;
  }
}

export const apiService = new ApiService();
