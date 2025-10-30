// types.ts

export interface Booking {
  id: string;
  guestName: string;
  contactPhone: string;
  email: string; // 新增email欄位
  lineName?: string;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  numberOfGuests: number;
  useCoupon: boolean;
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
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  useCoupon: boolean;
  arrivalTime?: string;
  totalPrice: number;
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