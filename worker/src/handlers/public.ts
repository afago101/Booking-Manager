// Public API handlers (no authentication required)

import { Context } from 'hono';
import { SheetsService } from '../utils/sheets';
import { AvailabilityDay, Booking } from '../types';
import {
  generateId,
  getDatesInRange,
  calculateNights,
  isWeekend,
  validateDateFormat,
  validatePhoneNumber,
  errorResponse,
  successResponse,
} from '../utils/helpers';
import { sendBookingNotification } from '../utils/email';

export async function handleGetAvailability(c: Context): Promise<Response> {
  try {
    const from = c.req.query('from');
    const to = c.req.query('to');

    if (!from || !to) {
      return errorResponse('Missing from or to query parameter', 'BAD_REQUEST', 400);
    }

    if (!validateDateFormat(from) || !validateDateFormat(to)) {
      return errorResponse('Invalid date format. Use YYYY-MM-DD', 'BAD_REQUEST', 400);
    }

    const sheets = c.get('sheets') as SheetsService;

    const [bookings, inventory, defaultCapacitySetting, closedDatesStr] = await Promise.all([
      sheets.getBookings(),
      sheets.getInventory(),
      sheets.getSetting('defaultCapacity'),
      sheets.getSetting('closedDates'),
    ]);

    const defaultCapacity = parseInt(defaultCapacitySetting || '1');
    let closedDates: string[] = [];
    try {
      closedDates = JSON.parse(closedDatesStr || '[]');
    } catch {
      closedDates = [];
    }
    
    const dates = getDatesInRange(from, to);
    const availability: AvailabilityDay[] = [];

    for (const date of dates) {
      const inventoryDay = inventory.find(inv => inv.date === date);
      // 檢查 Prices 工作表的 isClosed 或 config 的 closedDates
      const isClosed = inventoryDay?.isClosed || closedDates.includes(date);
      const capacity = inventoryDay?.capacity || defaultCapacity;

      // Count confirmed bookings for this date
      const bookedCount = bookings.filter(booking => {
        if (booking.status === 'cancelled') return false;
        const bookingDates = getDatesInRange(booking.checkInDate, booking.checkOutDate);
        return bookingDates.includes(date);
      }).length;

      availability.push({
        date,
        isClosed,
        capacity,
        bookedCount,
        available: !isClosed && bookedCount < capacity,
      });
    }

    return successResponse(availability);
  } catch (error: any) {
    console.error('Error in handleGetAvailability:', error);
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function handleQuote(c: Context): Promise<Response> {
  try {
    const body = await c.req.json();
    const { checkInDate, checkOutDate, numberOfGuests, useCoupon } = body;

    if (!checkInDate || !checkOutDate) {
      return errorResponse('Missing required fields', 'BAD_REQUEST', 400);
    }

    if (!validateDateFormat(checkInDate) || !validateDateFormat(checkOutDate)) {
      return errorResponse('Invalid date format', 'BAD_REQUEST', 400);
    }

    if (new Date(checkInDate) >= new Date(checkOutDate)) {
      return errorResponse('Check-out date must be after check-in date', 'BAD_REQUEST', 400);
    }

    const sheets = c.get('sheets') as SheetsService;

    const [nightlyPrice, weekendPrice, couponDiscount] = await Promise.all([
      sheets.getSetting('nightlyPriceDefault'),
      sheets.getSetting('weekendPriceDefault'),
      sheets.getSetting('couponDiscount'),
    ]);

    const defaultNightlyPrice = parseFloat(nightlyPrice || '5000');
    const defaultWeekendPrice = parseFloat(weekendPrice || '7000');
    const discount = useCoupon ? parseFloat(couponDiscount || '500') : 0;

    const dates = getDatesInRange(checkInDate, checkOutDate);
    let basePrice = 0;

    for (const date of dates) {
      const price = isWeekend(date) ? defaultWeekendPrice : defaultNightlyPrice;
      basePrice += price;
    }

    const total = Math.max(0, basePrice - discount);

    return successResponse({
      nights: dates.length,
      basePrice,
      discount,
      total,
    });
  } catch (error: any) {
    console.error('Error in handleQuote:', error);
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function handleCreateBooking(c: Context): Promise<Response> {
  try {
    const body = await c.req.json();
    const {
      guestName,
      contactPhone,
      lineName,
      checkInDate,
      checkOutDate,
      numberOfGuests,
      useCoupon,
      arrivalTime,
      totalPrice,
    } = body;

    // Validation
    if (!guestName || !contactPhone || !checkInDate || !checkOutDate || !numberOfGuests || totalPrice === undefined) {
      return errorResponse('Missing required fields', 'BAD_REQUEST', 400);
    }

    if (!validatePhoneNumber(contactPhone)) {
      return errorResponse('Invalid phone number format', 'BAD_REQUEST', 400);
    }

    if (!validateDateFormat(checkInDate) || !validateDateFormat(checkOutDate)) {
      return errorResponse('Invalid date format', 'BAD_REQUEST', 400);
    }

    if (new Date(checkInDate) >= new Date(checkOutDate)) {
      return errorResponse('Check-out date must be after check-in date', 'BAD_REQUEST', 400);
    }

    if (numberOfGuests <= 0) {
      return errorResponse('Number of guests must be greater than 0', 'BAD_REQUEST', 400);
    }

    const sheets = c.get('sheets') as SheetsService;

    // Check availability
    const dates = getDatesInRange(checkInDate, checkOutDate);
    const [bookings, inventory, defaultCapacitySetting, closedDatesStr] = await Promise.all([
      sheets.getBookings(),
      sheets.getInventory(),
      sheets.getSetting('defaultCapacity'),
      sheets.getSetting('closedDates'),
    ]);

    const defaultCapacity = parseInt(defaultCapacitySetting || '1');
    let closedDates: string[] = [];
    try {
      closedDates = JSON.parse(closedDatesStr || '[]');
    } catch {
      closedDates = [];
    }

    for (const date of dates) {
      const inventoryDay = inventory.find(inv => inv.date === date);
      // 檢查 Prices 工作表的 isClosed 或 config 的 closedDates
      const isClosed = inventoryDay?.isClosed || closedDates.includes(date);
      const capacity = inventoryDay?.capacity || defaultCapacity;

      if (isClosed) {
        return errorResponse(`Date ${date} is closed`, 'CONFLICT', 409);
      }

      const bookedCount = bookings.filter(booking => {
        if (booking.status === 'cancelled') return false;
        const bookingDates = getDatesInRange(booking.checkInDate, booking.checkOutDate);
        return bookingDates.includes(date);
      }).length;

      if (bookedCount >= capacity) {
        return errorResponse(`Date ${date} is fully booked`, 'CONFLICT', 409);
      }
    }

    // Create booking
    const now = new Date().toISOString();
    const newBooking: Booking = {
      id: generateId('booking'),
      guestName,
      contactPhone,
      lineName,
      checkInDate,
      checkOutDate,
      numberOfGuests,
      useCoupon: useCoupon || false,
      arrivalTime,
      totalPrice,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    await sheets.createBooking(newBooking);

    // 發送 email 通知（異步，不阻塞響應）
    const sendEmailNotification = async () => {
      try {
        console.log('📧 Starting email notification process...');
        
        const [notificationEmailsStr, emailApiKey, emailFrom, emailFromName] = await Promise.all([
          sheets.getSetting('notificationEmails'),
          sheets.getSetting('emailApiKey'),
          sheets.getSetting('emailFrom'),
          sheets.getSetting('emailFromName'),
        ]);

        console.log('📧 Email config retrieved:', {
          notificationEmailsStr: notificationEmailsStr ? '***' : 'null',
          emailApiKey: emailApiKey ? '***' : 'null',
          emailFrom: emailFrom || 'null',
          emailFromName: emailFromName || 'null',
        });

        let notificationEmails: string[] = [];
        try {
          notificationEmails = JSON.parse(notificationEmailsStr || '[]');
          console.log('📧 Parsed notification emails:', notificationEmails);
        } catch (parseError) {
          console.error('📧 Failed to parse notificationEmails JSON:', parseError);
          notificationEmails = [];
        }

        if (notificationEmails.length === 0) {
          console.log('📧 No notification emails configured, skipping email notification');
          return;
        }

        if (!emailApiKey) {
          console.log('📧 No email API key configured, skipping email notification');
          return;
        }

        console.log('📧 Sending email notification to:', notificationEmails);
        
        const emailResult = await sendBookingNotification(
          {
            apiKey: emailApiKey,
            fromEmail: emailFrom || 'noreply@example.com',
            fromName: emailFromName || '訂房系統',
          },
          notificationEmails,
          {
            bookingId: newBooking.id,
            guestName: newBooking.guestName,
            contactPhone: newBooking.contactPhone,
            lineName: newBooking.lineName || '',
            checkInDate: newBooking.checkInDate,
            checkOutDate: newBooking.checkOutDate,
            numberOfGuests: newBooking.numberOfGuests,
            totalPrice: newBooking.totalPrice,
            createdAt: newBooking.createdAt,
          }
        );

        console.log('📧 Email notification result:', emailResult);
      } catch (emailError) {
        console.error('📧 Failed to send email notification:', emailError);
        // 不影響訂單創建的成功響應
      }
    };

    // 非阻塞發送email
    c.executionCtx?.waitUntil(sendEmailNotification());

    return new Response(
      JSON.stringify({ id: newBooking.id, status: newBooking.status }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in handleCreateBooking:', error);
    
    if (error.message.includes('CONFLICT')) {
      return errorResponse('Booking conflict detected', 'CONFLICT', 409);
    }

    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

