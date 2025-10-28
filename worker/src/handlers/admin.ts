// Admin API handlers (require authentication)

import { Context } from 'hono';
import { SheetsService } from '../utils/sheets';
import {
  getDatesInRange,
  validateDateFormat,
  errorResponse,
  successResponse,
} from '../utils/helpers';

export async function handleGetBookings(c: Context): Promise<Response> {
  try {
    const from = c.req.query('from');
    const to = c.req.query('to');
    const status = c.req.query('status');

    const sheets = c.get('sheets') as SheetsService;
    let bookings = await sheets.getBookings();

    // Filter by date range
    if (from && to) {
      if (!validateDateFormat(from) || !validateDateFormat(to)) {
        return errorResponse('Invalid date format', 'BAD_REQUEST', 400);
      }

      bookings = bookings.filter(booking => {
        return booking.checkInDate >= from && booking.checkInDate <= to;
      });
    }

    // Filter by status
    if (status) {
      if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
        return errorResponse('Invalid status', 'BAD_REQUEST', 400);
      }
      bookings = bookings.filter(booking => booking.status === status);
    }

    // Sort by check-in date (most recent first)
    bookings.sort((a, b) => b.checkInDate.localeCompare(a.checkInDate));

    return successResponse(bookings);
  } catch (error: any) {
    console.error('Error in handleGetBookings:', error);
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function handleUpdateBooking(c: Context): Promise<Response> {
  try {
    const bookingId = c.req.param('id');
    const body = await c.req.json();
    const { status, totalPrice, arrivalTime, updatedAt } = body;

    if (!updatedAt) {
      return errorResponse('updatedAt field is required for optimistic locking', 'BAD_REQUEST', 400);
    }

    if (status && !['pending', 'confirmed', 'cancelled'].includes(status)) {
      return errorResponse('Invalid status', 'BAD_REQUEST', 400);
    }

    const sheets = c.get('sheets') as SheetsService;

    const updates: any = {};
    if (status) updates.status = status;
    if (totalPrice !== undefined) updates.totalPrice = totalPrice;
    if (arrivalTime !== undefined) updates.arrivalTime = arrivalTime;

    try {
      await sheets.updateBooking(bookingId, updates, updatedAt);
    } catch (error: any) {
      if (error.message.includes('CONFLICT')) {
        return errorResponse(
          'Booking has been modified by another user. Please refresh and try again.',
          'CONFLICT',
          409
        );
      }
      throw error;
    }

    // Fetch and return updated booking
    const bookings = await sheets.getBookings();
    const updated = bookings.find(b => b.id === bookingId);

    if (!updated) {
      return errorResponse('Booking not found after update', 'NOT_FOUND', 404);
    }

    return successResponse(updated);
  } catch (error: any) {
    console.error('Error in handleUpdateBooking:', error);
    
    if (error.message === 'Booking not found') {
      return errorResponse('Booking not found', 'NOT_FOUND', 404);
    }

    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function handleDeleteBooking(c: Context): Promise<Response> {
  try {
    const bookingId = c.req.param('id');
    const sheets = c.get('sheets') as SheetsService;

    await sheets.deleteBooking(bookingId);

    return new Response(null, { status: 204 });
  } catch (error: any) {
    console.error('Error in handleDeleteBooking:', error);
    
    if (error.message === 'Booking not found') {
      return errorResponse('Booking not found', 'NOT_FOUND', 404);
    }

    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function handleGetInventory(c: Context): Promise<Response> {
  try {
    const from = c.req.query('from');
    const to = c.req.query('to');

    const sheets = c.get('sheets') as SheetsService;
    let inventory = await sheets.getInventory();

    if (from && to) {
      if (!validateDateFormat(from) || !validateDateFormat(to)) {
        return errorResponse('Invalid date format', 'BAD_REQUEST', 400);
      }

      const dates = getDatesInRange(from, to);
      inventory = inventory.filter(inv => dates.includes(inv.date));
    }

    return successResponse(inventory);
  } catch (error: any) {
    console.error('Error in handleGetInventory:', error);
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function handleUpdateInventory(c: Context): Promise<Response> {
  try {
    const date = c.req.param('date');
    
    if (!validateDateFormat(date)) {
      return errorResponse('Invalid date format', 'BAD_REQUEST', 400);
    }

    const body = await c.req.json();
    const { isClosed, capacity, note } = body;

    if (isClosed === undefined) {
      return errorResponse('isClosed field is required', 'BAD_REQUEST', 400);
    }

    const sheets = c.get('sheets') as SheetsService;

    const inventoryData = {
      date,
      isClosed,
      capacity: capacity || 1,
      note,
    };

    await sheets.updateInventory(date, inventoryData);

    return successResponse(inventoryData);
  } catch (error: any) {
    console.error('Error in handleUpdateInventory:', error);
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function handleGetSettings(c: Context): Promise<Response> {
  try {
    const sheets = c.get('sheets') as SheetsService;
    const settings = await sheets.getSettings();

    // Convert to key-value object
    const settingsObj: Record<string, string> = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });

    return successResponse(settingsObj);
  } catch (error: any) {
    console.error('Error in handleGetSettings:', error);
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function handleUpdateSettings(c: Context): Promise<Response> {
  try {
    const body = await c.req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return errorResponse('key and value fields are required', 'BAD_REQUEST', 400);
    }

    const sheets = c.get('sheets') as SheetsService;
    await sheets.updateSetting(key, value);

    return successResponse({ key, value, updatedAt: new Date().toISOString() });
  } catch (error: any) {
    console.error('Error in handleUpdateSettings:', error);
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

