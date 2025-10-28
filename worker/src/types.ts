// Shared types for Worker

export interface Booking {
  id: string;
  guestName: string;
  contactPhone: string;
  lineName?: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  useCoupon: boolean;
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

export interface Env {
  GOOGLE_SHEETS_ID: string;
  GOOGLE_CLIENT_EMAIL: string;
  GOOGLE_PRIVATE_KEY: string;
  ADMIN_API_KEY: string;
  CORS_ORIGINS?: string;
  NODE_ENV?: string;
}

