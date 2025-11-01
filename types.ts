// types.ts

export interface Booking {
  id: string;
  guestName: string;
  contactPhone: string;
  email: string; // 新增email欄位
  lineName?: string;
  lineUserId?: string; // LINE User ID
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  numberOfGuests: number;
  useCoupon: boolean;
  couponCode?: string; // 使用的優惠券代碼
  arrivalTime?: string; // HH:mm
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface Inventory {
  date: string; // YYYY-MM-DD
  isClosed: boolean;
  capacity: number;
  note?: string;
}

export interface Setting {
  key: string;
  value: string;
  updatedAt: string; // ISO 8601
}

export interface AvailabilityDay {
  date: string; // YYYY-MM-DD
  isClosed: boolean;
  capacity: number;
  bookedCount: number;
  available: boolean;
}

export interface QuoteRequest {
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  useCoupon: boolean;
}

export interface QuoteResponse {
  nights: number;
  basePrice: number;
  discount: number;
  total: number;
}

export interface BookingCreateRequest {
  guestName: string;
  contactPhone: string;
  email: string; // 新增email欄位
  lineName?: string;
  lineUserId?: string; // LINE User ID
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  useCoupon: boolean;
  couponCode?: string; // 優惠券代碼
  arrivalTime?: string;
  totalPrice: number;
}

export interface CustomerProfile {
  lineUserId: string;
  guestName: string;
  contactPhone: string;
  email?: string;
  lineName?: string;
  totalNights: number; // 累計住宿晚數
  totalBookings: number; // 累計訂單數
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  couponCode: string;
  type: 'stay_discount' | 'free_night'; // 住兩晚折300 或 10晚送1晚
  lineUserId: string; // 擁有者
  status: 'active' | 'used' | 'expired';
  value: number; // 折扣金額或晚數
  minNights?: number; // 最少晚數要求（10晚送1晚需連續兩晚）
  createdAt: string;
  usedAt?: string;
  expiresAt?: string;
}

export interface BookingUpdateRequest {
  status?: 'pending' | 'confirmed' | 'cancelled';
  totalPrice?: number;
  arrivalTime?: string;
  updatedAt: string; // For optimistic locking
}

export interface InventoryUpdateRequest {
  isClosed: boolean;
  capacity?: number;
  note?: string;
  updatedAt?: string;
}

export interface ApiError {
  error: string;
  code: 'BAD_REQUEST' | 'UNAUTHORIZED' | 'CONFLICT' | 'NOT_FOUND' | 'INTERNAL_ERROR';
}

// Storing daily prices. Key is date string "YYYY-MM-DD"
export interface DailyPrices {
  defaultWeekday: number;
  defaultWeekend: number;
  dates: {
    [date: string]: number;
  };
  closedDates?: string[];
}

// For form data state
export interface BookingFormData {
    guestName: string;
    contactPhone: string;
    email: string; // 新增email欄位
    lineName: string;
    numberOfGuests: number;
    useCoupon: 'yes' | 'no';
    arrivalTime: string;
}