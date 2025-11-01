// LINE Login and customer profile handlers

import { Context } from 'hono';
import { SheetsService } from '../utils/sheets';
import { errorResponse } from '../utils/helpers';
import { CustomerProfile, Coupon, Booking } from '../types';
import { serviceLogger } from '../utils/logger';

/**
 * 處理 LINE OAuth callback - 交換 authorization code 取得 id token
 * POST /api/line/oauth/callback
 */
export async function handleLineOAuthCallback(c: Context): Promise<Response> {
  const startTime = Date.now();
  try {
    const body = await c.req.json();
    const { code, redirectUri } = body;

    if (!code || !redirectUri) {
      serviceLogger.log({
        service: 'line',
        action: 'oauth_callback',
        status: 'error',
        message: 'Missing code or redirectUri',
      });
      return errorResponse('Missing code or redirectUri', 'BAD_REQUEST', 400);
    }

    const lineChannelId = c.env.LINE_CHANNEL_ID;
    const lineChannelSecret = c.env.LINE_CHANNEL_SECRET;

    if (!lineChannelId || !lineChannelSecret) {
      serviceLogger.log({
        service: 'line',
        action: 'oauth_callback',
        status: 'error',
        message: 'LINE configuration missing',
      });
      return errorResponse('LINE configuration missing', 'INTERNAL_ERROR', 500);
    }

    // 交換 authorization code 取得 access token
    serviceLogger.log({
      service: 'line',
      action: 'oauth_callback',
      status: 'success',
      message: 'OAuth callback request received',
      details: {
        redirectUri,
        channelId: lineChannelId,
        hasSecret: !!lineChannelSecret,
      },
    });

    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: lineChannelId,
        client_secret: lineChannelSecret,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      const duration = Date.now() - startTime;
      
      let errorMessage = 'Failed to exchange OAuth code';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error_description || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      
      serviceLogger.log({
        service: 'line',
        action: 'oauth_callback',
        status: 'error',
        message: errorMessage,
        duration,
        details: {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          error: errorText,
          redirectUri,
          channelId: lineChannelId,
        },
      });
      
      return errorResponse(errorMessage, 'UNAUTHORIZED', 401);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      serviceLogger.log({
        service: 'line',
        action: 'oauth_callback',
        status: 'error',
        message: 'No access_token in response',
        duration: Date.now() - startTime,
      });
      return errorResponse('No access_token in response', 'INTERNAL_ERROR', 500);
    }

    // 使用 access token 取得使用者資料（不使用 id_token）
    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!profileResponse.ok) {
      const error = await profileResponse.text();
      const duration = Date.now() - startTime;
      serviceLogger.log({
        service: 'line',
        action: 'oauth_callback',
        status: 'error',
        message: 'Failed to get LINE profile',
        duration,
        details: { error },
      });
      return errorResponse('Failed to get LINE profile', 'UNAUTHORIZED', 401);
    }

    const lineUser = await profileResponse.json();
    const duration = Date.now() - startTime;

    serviceLogger.log({
      service: 'line',
      action: 'oauth_callback',
      status: 'success',
      message: 'OAuth callback completed successfully',
      duration,
      userId: lineUser.userId,
      details: {
        name: lineUser.displayName,
        hasPicture: !!lineUser.pictureUrl,
      },
    });

    // 返回 access token 和 user info
    // 注意：lineUser.userId 是 LINE Login 的 userId，與 LINE 平台的 userId 可能不同
    // 如果在 LINE 環境中使用 LIFF，會取得真正的 LINE User ID
    return c.json({
      accessToken, // 改為返回 accessToken 而不是 idToken
      lineUserId: lineUser.userId, // LINE Login 的 userId
      name: lineUser.displayName,
      picture: lineUser.pictureUrl,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    serviceLogger.log({
      service: 'line',
      action: 'oauth_callback',
      status: 'error',
      message: 'Error handling OAuth callback',
      duration,
      details: {
        error: error.message || String(error),
      },
    });
    console.error('Error handling OAuth callback:', error);
    return errorResponse(error.message || 'Failed to handle OAuth callback', 'INTERNAL_ERROR', 500);
  }
}

/**
 * 驗證 LINE Token 並取得 LINE User ID
 * 支援兩種方式：
 * 1. LIFF 的 idToken（如果提供）- 取得真正的 LINE User ID
 * 2. OAuth 的 accessToken（如果提供）- 取得 LINE Login 的 userId
 * POST /api/line/verify
 */
export async function handleVerifyLineToken(c: Context): Promise<Response> {
  const startTime = Date.now();
  try {
    const body = await c.req.json();
    const { idToken, accessToken } = body;

    const lineChannelId = c.env.LINE_CHANNEL_ID;
    const lineChannelSecret = c.env.LINE_CHANNEL_SECRET;

    if (!lineChannelId || !lineChannelSecret) {
      serviceLogger.log({
        service: 'line',
        action: 'verify_token',
        status: 'error',
        message: 'LINE configuration missing',
      });
      return errorResponse('LINE configuration missing', 'INTERNAL_ERROR', 500);
    }

    // 優先使用 idToken（來自 LIFF），可以取得真正的 LINE User ID
    if (idToken) {
      serviceLogger.log({
        service: 'line',
        action: 'verify_token',
        status: 'success',
        message: 'Verifying idToken from LIFF',
        details: {
          hasIdToken: true,
        },
      });

      const verifyResponse = await fetch('https://api.line.me/oauth2/v2.1/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          id_token: idToken,
          client_id: lineChannelId,
        }),
      });

      if (!verifyResponse.ok) {
        const error = await verifyResponse.text();
        const duration = Date.now() - startTime;
        serviceLogger.log({
          service: 'line',
          action: 'verify_token',
          status: 'error',
          message: 'LINE token verification failed',
          duration,
          details: { error },
        });
        console.error('LINE token verification failed:', error);
        return errorResponse('Invalid LINE token', 'UNAUTHORIZED', 401);
      }

      const lineUser = await verifyResponse.json();
      const duration = Date.now() - startTime;

      serviceLogger.log({
        service: 'line',
        action: 'verify_token',
        status: 'success',
        message: 'Token verified successfully (LIFF)',
        duration,
        userId: lineUser.sub,
        details: {
          name: lineUser.name,
          hasPicture: !!lineUser.picture,
        },
      });

      // 返回真正的 LINE User ID（sub）
      return c.json({
        lineUserId: lineUser.sub, // 真正的 LINE User ID
        name: lineUser.name,
        picture: lineUser.picture,
      });
    }

    // 使用 accessToken（來自 OAuth，沒有 OpenID Connect）
    if (accessToken) {
      serviceLogger.log({
        service: 'line',
        action: 'verify_token',
        status: 'success',
        message: 'Verifying accessToken from OAuth',
        details: {
          hasAccessToken: true,
        },
      });

      const profileResponse = await fetch('https://api.line.me/v2/profile', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!profileResponse.ok) {
        const error = await profileResponse.text();
        const duration = Date.now() - startTime;
        serviceLogger.log({
          service: 'line',
          action: 'verify_token',
          status: 'error',
          message: 'LINE profile API failed',
          duration,
          details: { error },
        });
        console.error('LINE profile API failed:', error);
        return errorResponse('Invalid access token', 'UNAUTHORIZED', 401);
      }

      const lineUser = await profileResponse.json();
      const duration = Date.now() - startTime;

      serviceLogger.log({
        service: 'line',
        action: 'verify_token',
        status: 'success',
        message: 'Token verified successfully (OAuth)',
        duration,
        userId: lineUser.userId,
        details: {
          name: lineUser.displayName,
          hasPicture: !!lineUser.pictureUrl,
        },
      });

      // 返回 LINE Login 的 userId（與 LINE 平台的 userId 可能不同）
      return c.json({
        lineUserId: lineUser.userId, // LINE Login 的 userId
        name: lineUser.displayName,
        picture: lineUser.pictureUrl,
      });
    }

    const duration = Date.now() - startTime;
    serviceLogger.log({
      service: 'line',
      action: 'verify_token',
      status: 'error',
      message: 'Missing idToken or accessToken',
      duration,
    });
    
    return errorResponse('Missing idToken or accessToken', 'BAD_REQUEST', 400);
  } catch (error: any) {
    const duration = Date.now() - startTime;
    serviceLogger.log({
      service: 'line',
      action: 'verify_token',
      status: 'error',
      message: 'Error verifying LINE token',
      duration,
      details: {
        error: error.message || String(error),
      },
    });
    console.error('Error verifying LINE token:', error);
    return errorResponse(error.message || 'Failed to verify LINE token', 'INTERNAL_ERROR', 500);
  }
}

/**
 * 取得或建立客戶資料
 * GET /api/line/profile/:lineUserId
 */
export async function handleGetCustomerProfile(c: Context): Promise<Response> {
  try {
    const lineUserId = c.req.param('lineUserId');
    if (!lineUserId) {
      return errorResponse('Missing lineUserId', 'BAD_REQUEST', 400);
    }

    const sheets = c.get('sheets') as SheetsService;
    const profile = await sheets.getCustomerProfile(lineUserId);

    if (!profile) {
      return errorResponse('Profile not found', 'NOT_FOUND', 404);
    }

    return c.json(profile);
  } catch (error: any) {
    console.error('Error getting customer profile:', error);
    return errorResponse(error.message || 'Failed to get profile', 'INTERNAL_ERROR', 500);
  }
}

/**
 * 同步 LINE 客戶資料（從 LINE 取得資訊後建立或更新客戶資料）
 * POST /api/line/sync-profile
 */
export async function handleSyncCustomerProfile(c: Context): Promise<Response> {
  const startTime = Date.now();
  try {
    const body = await c.req.json();
    const { lineUserId, name, picture, guestName, contactPhone, email } = body;

    if (!lineUserId) {
      serviceLogger.log({
        service: 'line',
        action: 'sync_profile',
        status: 'error',
        message: 'Missing lineUserId',
      });
      return errorResponse('Missing lineUserId', 'BAD_REQUEST', 400);
    }

    const sheets = c.get('sheets') as SheetsService;
    
    // 取得現有客戶資料（如果有的話）
    let profile = await sheets.getCustomerProfile(lineUserId);
    const isNew = !profile;

    if (!profile) {
      // 建立新客戶資料（尚未有訂單，所以 totalNights 和 totalBookings 為 0）
      profile = {
        lineUserId,
        guestName: guestName || name || '',
        contactPhone: contactPhone || '',
        email: email || '',
        lineName: name || '',
        totalNights: 0,
        totalBookings: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await sheets.createOrUpdateCustomerProfile(profile);
    } else {
      // 更新現有客戶資料（更新基本資訊，但保留累計數據）
      profile.lineName = name || profile.lineName || '';
      if (guestName) profile.guestName = guestName;
      if (contactPhone) profile.contactPhone = contactPhone;
      if (email) profile.email = email;
      profile.updatedAt = new Date().toISOString();
      await sheets.createOrUpdateCustomerProfile(profile);
    }

    const duration = Date.now() - startTime;

    serviceLogger.log({
      service: 'line',
      action: 'sync_profile',
      status: 'success',
      message: isNew ? 'Customer profile created' : 'Customer profile updated',
      duration,
      userId: lineUserId,
      details: {
        isNew,
        name: name || profile.lineName,
        hasGuestName: !!profile.guestName,
        hasContactPhone: !!profile.contactPhone,
        hasEmail: !!profile.email,
      },
    });

    return c.json({
      success: true,
      profile,
      message: 'Customer profile synced successfully',
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    serviceLogger.log({
      service: 'line',
      action: 'sync_profile',
      status: 'error',
      message: 'Error syncing customer profile',
      duration,
      userId: body?.lineUserId,
      details: {
        error: error.message || String(error),
      },
    });
    
    console.error('Error syncing customer profile:', error);
    return errorResponse(error.message || 'Failed to sync profile', 'INTERNAL_ERROR', 500);
  }
}

/**
 * 將訂單與 LINE User ID 關聯（綁定）
 * POST /api/line/bind-booking
 */
export async function handleBindBooking(c: Context): Promise<Response> {
  const startTime = Date.now();
  try {
    const body = await c.req.json();
    const { bookingId, lineUserId, guestName, contactPhone, email } = body;

    if (!bookingId || !lineUserId) {
      serviceLogger.log({
        service: 'line',
        action: 'bind_booking',
        status: 'error',
        message: 'Missing bookingId or lineUserId',
      });
      return errorResponse('Missing bookingId or lineUserId', 'BAD_REQUEST', 400);
    }

    const sheets = c.get('sheets') as SheetsService;

    serviceLogger.log({
      service: 'line',
      action: 'bind_booking',
      status: 'success',
      message: 'Binding booking to LINE account',
      userId: lineUserId,
      details: {
        bookingId,
      },
    });

    // 取得訂單
    const bookings = await sheets.getBookings();
    const booking = bookings.find(b => b.id === bookingId);

    if (!booking) {
      const duration = Date.now() - startTime;
      serviceLogger.log({
        service: 'line',
        action: 'bind_booking',
        status: 'error',
        message: 'Booking not found',
        duration,
        userId: lineUserId,
        details: { bookingId },
      });
      return errorResponse('Booking not found', 'NOT_FOUND', 404);
    }

    // 檢查訂單是否已有 LINE User ID
    if (booking.lineUserId && booking.lineUserId !== lineUserId) {
      const duration = Date.now() - startTime;
      serviceLogger.log({
        service: 'line',
        action: 'bind_booking',
        status: 'error',
        message: 'Booking already bound to another LINE account',
        duration,
        userId: lineUserId,
        details: {
          bookingId,
          existingLineUserId: booking.lineUserId,
        },
      });
      return errorResponse('Booking already bound to another LINE account', 'CONFLICT', 409);
    }

    // 更新訂單，加入 LINE User ID
    await sheets.updateBooking(bookingId, {
      lineUserId,
      lineName: booking.lineName || guestName,
    }, booking.updatedAt);

    // 取得或建立客戶資料
    let profile = await sheets.getCustomerProfile(lineUserId);
    
    const nights = Math.ceil(
      (new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / 
      (1000 * 60 * 60 * 24)
    );

    if (!profile) {
      // 建立新客戶資料
      profile = {
        lineUserId,
        guestName: guestName || booking.guestName,
        contactPhone: contactPhone || booking.contactPhone,
        email: email || booking.email,
        lineName: booking.lineName || guestName,
        totalNights: nights,
        totalBookings: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await sheets.createOrUpdateCustomerProfile(profile);
    } else {
      // 更新現有客戶資料
      profile.totalNights += nights;
      profile.totalBookings += 1;
      profile.updatedAt = new Date().toISOString();
      if (guestName) profile.guestName = guestName;
      if (contactPhone) profile.contactPhone = contactPhone;
      if (email) profile.email = email;
      await sheets.createOrUpdateCustomerProfile(profile);
    }

    const duration = Date.now() - startTime;
    const profileWasNew = !profile || profile.totalBookings === 1;

    serviceLogger.log({
      service: 'line',
      action: 'bind_booking',
      status: 'success',
      message: 'Booking bound successfully',
      duration,
      userId: lineUserId,
      details: {
        bookingId,
        profileWasNew,
        totalNights: profile.totalNights,
        totalBookings: profile.totalBookings,
      },
    });

    // 檢查是否應該發放優惠券（每10晚送1晚）
    if (profile.totalNights >= 10 && profile.totalNights - nights < 10) {
      // 檢查是否已有此類型的有效優惠券
      const existingCoupons = await sheets.getCoupons(lineUserId);
      const hasFreeNightCoupon = existingCoupons.some(
        c => c.type === 'free_night' && c.status === 'active'
      );

      if (!hasFreeNightCoupon) {
        // 發放10晚送1晚優惠券
        const couponCode = `FREE${Date.now().toString(36).toUpperCase()}`;
        const freeNightCoupon: Coupon = {
          id: `coupon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          couponCode,
          type: 'free_night',
          lineUserId,
          status: 'active',
          value: 1, // 1晚
          minNights: 2, // 需連續兩晚
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1年後過期
        };
        await sheets.createCoupon(freeNightCoupon);
      }
    }

    // 檢查是否應該發放住兩晚折300優惠券（每筆訂單可獲得）
    if (nights >= 2) {
      const stayDiscountCoupon: Coupon = {
        id: `coupon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        couponCode: `DISCOUNT${Date.now().toString(36).toUpperCase()}`,
        type: 'stay_discount',
        lineUserId,
        status: 'active',
        value: 300, // 折300
        minNights: 2, // 需住兩晚
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90天後過期
      };
      await sheets.createCoupon(stayDiscountCoupon);
    }

    return c.json({
      success: true,
      booking: { ...booking, lineUserId },
      profile,
    });
  } catch (error: any) {
    console.error('Error binding booking:', error);
    return errorResponse(error.message || 'Failed to bind booking', 'INTERNAL_ERROR', 500);
  }
}

/**
 * 取得客戶的優惠券列表
 * GET /api/line/coupons/:lineUserId
 */
export async function handleGetCoupons(c: Context): Promise<Response> {
  try {
    const lineUserId = c.req.param('lineUserId');
    if (!lineUserId) {
      return errorResponse('Missing lineUserId', 'BAD_REQUEST', 400);
    }

    const sheets = c.get('sheets') as SheetsService;
    const coupons = await sheets.getCoupons(lineUserId);

    // 過濾出有效的優惠券（active 且未過期）
    const now = new Date();
    const validCoupons = coupons.filter(c => {
      if (c.status !== 'active') return false;
      if (c.expiresAt && new Date(c.expiresAt) < now) return false;
      return true;
    });

    return c.json(validCoupons);
  } catch (error: any) {
    console.error('Error getting coupons:', error);
    return errorResponse(error.message || 'Failed to get coupons', 'INTERNAL_ERROR', 500);
  }
}

/**
 * 取得客戶的訂單列表
 * GET /api/line/bookings/:lineUserId
 */
export async function handleGetCustomerBookings(c: Context): Promise<Response> {
  try {
    const lineUserId = c.req.param('lineUserId');
    if (!lineUserId) {
      return errorResponse('Missing lineUserId', 'BAD_REQUEST', 400);
    }

    const sheets = c.get('sheets') as SheetsService;
    const bookings = await sheets.getBookings();

    const customerBookings = bookings.filter(b => b.lineUserId === lineUserId);

    return c.json(customerBookings);
  } catch (error: any) {
    console.error('Error getting customer bookings:', error);
    return errorResponse(error.message || 'Failed to get bookings', 'INTERNAL_ERROR', 500);
  }
}

/**
 * 驗證優惠券並應用
 * POST /api/line/apply-coupon
 */
export async function handleApplyCoupon(c: Context): Promise<Response> {
  try {
    const body = await c.req.json();
    const { couponCode, checkInDate, checkOutDate, lineUserId } = body;

    if (!couponCode || !checkInDate || !checkOutDate || !lineUserId) {
      return errorResponse('Missing required fields', 'BAD_REQUEST', 400);
    }

    const sheets = c.get('sheets') as SheetsService;
    const coupons = await sheets.getCoupons(lineUserId);

    const coupon = coupons.find(c => c.couponCode === couponCode);

    if (!coupon) {
      return errorResponse('Coupon not found', 'NOT_FOUND', 404);
    }

    if (coupon.status !== 'active') {
      return errorResponse('Coupon is not active', 'BAD_REQUEST', 400);
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return errorResponse('Coupon has expired', 'BAD_REQUEST', 400);
    }

    // 計算住宿晚數
    const nights = Math.ceil(
      (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / 
      (1000 * 60 * 60 * 24)
    );

    // 檢查最低晚數要求
    if (coupon.minNights && nights < coupon.minNights) {
      return errorResponse(`Coupon requires at least ${coupon.minNights} nights`, 'BAD_REQUEST', 400);
    }

    // 檢查優惠券類型
    if (coupon.type === 'free_night' && nights < 2) {
      return errorResponse('Free night coupon requires at least 2 consecutive nights', 'BAD_REQUEST', 400);
    }

    return c.json({
      valid: true,
      coupon: {
        code: coupon.couponCode,
        type: coupon.type,
        value: coupon.value,
        minNights: coupon.minNights,
      },
    });
  } catch (error: any) {
    console.error('Error applying coupon:', error);
    return errorResponse(error.message || 'Failed to apply coupon', 'INTERNAL_ERROR', 500);
  }
}

