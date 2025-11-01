// Shared types for Worker

export interface Booking {
  id: string;
  guestName: string;
  contactPhone: string;
  email: string; // 新增email欄位
  lineName?: string;
  lineUserId?: string; // LINE User ID
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  useCoupon: boolean;
  couponCode?: string; // 使用的優惠券代碼
  arrivalTime?: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Inventory {
  date: string;
  isClosed: boolean;
  capacity: number;
  note?: string;
}

export interface Setting {
  key: string;
  value: string;
  updatedAt: string;
}

export interface AvailabilityDay {
  date: string;
  isClosed: boolean;
  capacity: number;
  bookedCount: number;
  available: boolean;
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

export interface Env {
  GOOGLE_SHEETS_ID: string;
  GOOGLE_CLIENT_EMAIL: string;
  GOOGLE_PRIVATE_KEY: string;
  ADMIN_API_KEY: string;
  CORS_ORIGINS?: string;
  NODE_ENV?: string;
  // Optional email config fallbacks via Worker secrets
  EMAIL_API_KEY?: string;
  EMAIL_FROM?: string;
  EMAIL_FROM_NAME?: string;
  // LINE Login config
  LINE_CHANNEL_ID?: string;
  LINE_CHANNEL_SECRET?: string;
}

