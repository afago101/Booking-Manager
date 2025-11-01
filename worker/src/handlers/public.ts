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
import { sendBookingNotification, sendCustomerConfirmationEmail } from '../utils/email';

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
    const { checkInDate, checkOutDate, numberOfGuests, useCoupon, couponCode, lineUserId } = body;

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

    const dates = getDatesInRange(checkInDate, checkOutDate);
    const nights = dates.length;

    // 取得價格設定
    const [nightlyPrice, weekendPrice, pricesData] = await Promise.all([
      sheets.getSetting('nightlyPriceDefault'),
      sheets.getSetting('weekendPriceDefault'),
      sheets.getPrices(),
    ]);

    const defaultNightlyPrice = parseFloat(nightlyPrice || '5000');
    const defaultWeekendPrice = parseFloat(weekendPrice || '7000');

    let basePrice = 0;
    for (const date of dates) {
      const priceEntry = pricesData.find(p => p.date === date);
      const isWeekendDay = isWeekend(date);
      const dailyPrice = priceEntry 
        ? priceEntry.price 
        : (isWeekendDay ? defaultWeekendPrice : defaultNightlyPrice);
      basePrice += dailyPrice;
    }

    // 計算優惠券折扣
    let discount = 0;
    let appliedCoupon = null;

    if (useCoupon && couponCode && lineUserId) {
      const coupons = await sheets.getCoupons(lineUserId);
      const coupon = coupons.find(c => 
        c.couponCode === couponCode && 
        c.status === 'active' &&
        (!c.expiresAt || new Date(c.expiresAt) > new Date())
      );

      if (coupon && (!coupon.minNights || nights >= coupon.minNights)) {
        if (coupon.type === 'stay_discount') {
          // 住兩晚折300
          discount = coupon.value;
        } else if (coupon.type === 'free_night' && nights >= 2) {
          // 10晚送1晚：計算最便宜的晚數價格
          const sortedPrices = dates.map(date => {
            const priceEntry = pricesData.find(p => p.date === date);
            const isWeekendDay = isWeekend(date);
            return priceEntry 
              ? priceEntry.price 
              : (isWeekendDay ? defaultWeekendPrice : defaultNightlyPrice);
          }).sort((a, b) => a - b);
          
          // 減去最便宜的晚數
          discount = sortedPrices[0] || 0;
        }
        appliedCoupon = {
          code: coupon.couponCode,
          type: coupon.type,
          value: discount,
        };
      }
    }

    const total = Math.max(0, basePrice - discount);

    return successResponse({
      nights,
      basePrice,
      discount,
      total,
      coupon: appliedCoupon,
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
      email,
      lineName,
      lineUserId,
      checkInDate,
      checkOutDate,
      numberOfGuests,
      useCoupon,
      couponCode,
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

    // 如果有使用優惠券，驗證優惠券
    if (useCoupon && couponCode && lineUserId) {
      const coupons = await sheets.getCoupons(lineUserId);
      const coupon = coupons.find(c => c.couponCode === couponCode && c.status === 'active');
      
      if (!coupon) {
        return errorResponse('Invalid or expired coupon', 'BAD_REQUEST', 400);
      }

      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return errorResponse('Coupon has expired', 'BAD_REQUEST', 400);
      }

      const nights = Math.ceil(
        (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / 
        (1000 * 60 * 60 * 24)
      );

      if (coupon.minNights && nights < coupon.minNights) {
        return errorResponse(`Coupon requires at least ${coupon.minNights} nights`, 'BAD_REQUEST', 400);
      }

      // 標記優惠券為已使用
      await sheets.updateCoupon(coupon.id, { status: 'used', usedAt: new Date().toISOString() });
    }

    // Create booking
    const now = new Date().toISOString();
    const newBooking: Booking = {
      id: generateId('booking'),
      guestName,
      contactPhone,
      email: body.email || '', // 添加 email 欄位
      lineName,
      lineUserId,
      checkInDate,
      checkOutDate,
      numberOfGuests,
      useCoupon: useCoupon || false,
      couponCode,
      arrivalTime,
      totalPrice,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    await sheets.createBooking(newBooking);

    // 如果有 LINE User ID，更新客戶資料
    if (lineUserId) {
      let profile = await sheets.getCustomerProfile(lineUserId);
      const nights = Math.ceil(
        (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / 
        (1000 * 60 * 60 * 24)
      );

      if (!profile) {
        profile = {
          lineUserId,
          guestName,
          contactPhone,
          email: email || '',
          lineName: lineName || '',
          totalNights: nights,
          totalBookings: 1,
          createdAt: now,
          updatedAt: now,
        };
      } else {
        profile.totalNights += nights;
        profile.totalBookings += 1;
        profile.updatedAt = now;
        if (guestName) profile.guestName = guestName;
        if (contactPhone) profile.contactPhone = contactPhone;
        if (email) profile.email = email;
        if (lineName) profile.lineName = lineName;
      }
      await sheets.createOrUpdateCustomerProfile(profile);

      // 檢查是否應該發放優惠券
      if (profile.totalNights >= 10 && profile.totalNights - nights < 10) {
        const existingCoupons = await sheets.getCoupons(lineUserId);
        const hasFreeNightCoupon = existingCoupons.some(
          c => c.type === 'free_night' && c.status === 'active'
        );

        if (!hasFreeNightCoupon) {
          const couponCode = `FREE${Date.now().toString(36).toUpperCase()}`;
          const freeNightCoupon = {
            id: `coupon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            couponCode,
            type: 'free_night' as const,
            lineUserId,
            status: 'active' as const,
            value: 1,
            minNights: 2,
            createdAt: now,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          };
          await sheets.createCoupon(freeNightCoupon);
        }
      }

      // 住兩晚以上發放折300優惠券
      if (nights >= 2) {
        const stayDiscountCoupon = {
          id: `coupon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          couponCode: `DISCOUNT${Date.now().toString(36).toUpperCase()}`,
          type: 'stay_discount' as const,
          lineUserId,
          status: 'active' as const,
          value: 300,
          minNights: 2,
          createdAt: now,
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        };
        await sheets.createCoupon(stayDiscountCoupon);
      }
    }

    // 分離成兩道任務：1) 立即通知管理者 2) 延時 3 秒寄給客戶
    const adminUrl = 'https://blessing-haven.marcux.uk/#/admin/login';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // 任務 1：立即通知管理者（內部自行抓設定）
    const notifyAdmins = async () => {
      try {
        const [notificationEmailsStr, sheetEmailApiKey, sheetEmailFrom, sheetEmailFromName] = await Promise.all([
          sheets.getSetting('notificationEmails'),
          sheets.getSetting('emailApiKey'),
          sheets.getSetting('emailFrom'),
          sheets.getSetting('emailFromName'),
        ]);

        const emailApiKey = sheetEmailApiKey || c.env.EMAIL_API_KEY || '';
        const emailFrom = sheetEmailFrom || c.env.EMAIL_FROM || 'booking@email.marcux.uk';
        const emailFromName = sheetEmailFromName || c.env.EMAIL_FROM_NAME || 'Blessing Haven';

        let notificationEmails: string[] = [];
        const raw = (notificationEmailsStr || '').trim();
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) notificationEmails = parsed as string[];
          } catch {
            notificationEmails = raw.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
          }
        }
        notificationEmails = notificationEmails.filter(e => emailRegex.test(e));

        if (notificationEmails.length > 0 && emailApiKey) {
          console.log('Scheduling admin notification email(s)', { recipientsCount: notificationEmails.length, at: new Date().toISOString() });
          await sendBookingNotification(
            { apiKey: emailApiKey, fromEmail: emailFrom, fromName: emailFromName },
            notificationEmails,
            {
              bookingId: newBooking.id,
              guestName: newBooking.guestName,
              contactPhone: newBooking.contactPhone,
              email: newBooking.email || '',
              lineName: newBooking.lineName || '',
              checkInDate: newBooking.checkInDate,
              checkOutDate: newBooking.checkOutDate,
              numberOfGuests: newBooking.numberOfGuests,
              totalPrice: newBooking.totalPrice,
              createdAt: newBooking.createdAt,
              viewUrl: adminUrl,
            }
          );
        } else {
          console.log('Admin email notification skipped: missing recipients or API key', {
            haveApiKey: Boolean(emailApiKey),
            recipientsCount: notificationEmails.length,
            at: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.error('Admin email notification error:', e);
      }
    };

    // 任務 2：延時 3 秒後寄送客戶確認信（內部自行抓設定）
    const notifyCustomerDelayed = async () => {
      try {
        const [sheetEmailApiKey, sheetEmailFrom, sheetEmailFromName] = await Promise.all([
          sheets.getSetting('emailApiKey'),
          sheets.getSetting('emailFrom'),
          sheets.getSetting('emailFromName'),
        ]);

        const emailApiKey = sheetEmailApiKey || c.env.EMAIL_API_KEY || '';
        const emailFrom = sheetEmailFrom || c.env.EMAIL_FROM || 'booking@email.marcux.uk';
        const emailFromName = sheetEmailFromName || c.env.EMAIL_FROM_NAME || 'Blessing Haven';

        const customerEmail = (newBooking.email || '').trim();
        const validEmail = emailRegex.test(customerEmail);
        console.log('Customer email check (scheduled)', { customerEmail, validEmail, haveApiKey: Boolean(emailApiKey), from: emailFrom, fromName: emailFromName, at: new Date().toISOString() });
        if (validEmail && emailApiKey) {
          // 等待 5 秒再寄出（避免與管理者通知併發觸發速率限制）
          await new Promise((resolve) => setTimeout(resolve, 5000));
          console.log('Sending customer confirmation email after 5s delay', { at: new Date().toISOString() });
          await sendCustomerConfirmationEmail(
            { apiKey: emailApiKey, fromEmail: emailFrom, fromName: emailFromName },
            customerEmail,
            {
              bookingId: newBooking.id,
              guestName: newBooking.guestName,
              contactPhone: newBooking.contactPhone,
              email: newBooking.email || '',
              lineName: newBooking.lineName || '',
              checkInDate: newBooking.checkInDate,
              checkOutDate: newBooking.checkOutDate,
              numberOfGuests: newBooking.numberOfGuests,
              totalPrice: newBooking.totalPrice,
              createdAt: newBooking.createdAt,
            }
          );
        } else {
          console.log('Customer confirmation email skipped (pre-check)', { reason: (!validEmail ? 'invalid_email' : '' ) || (!emailApiKey ? 'missing_api_key' : '' ), at: new Date().toISOString() });
        }
      } catch (e) {
        console.error('Customer confirmation email error (delayed):', e);
      }
    };

    // 非阻塞排程兩個任務
    if (c.executionCtx && typeof c.executionCtx.waitUntil === 'function') {
      c.executionCtx.waitUntil(notifyAdmins());
      c.executionCtx.waitUntil(notifyCustomerDelayed());
    } else {
      notifyAdmins().catch((e) => console.error('Background admin email error:', e));
      notifyCustomerDelayed().catch((e) => console.error('Background customer email error:', e));
    }

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

