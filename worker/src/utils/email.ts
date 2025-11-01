// Email notification utilities

import { serviceLogger } from './logger';

export interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

export interface BookingNotificationData {
  bookingId: string;
  guestName: string;
  contactPhone: string;
  email: string;
  lineName: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  totalPrice: number;
  createdAt: string;
  viewUrl?: string;
}

/**
 * 發送新訂單通知 email
 * 使用 Resend API (https://resend.com)
 */
export async function sendBookingNotification(
  config: EmailConfig,
  toEmails: string[],
  bookingData: BookingNotificationData
): Promise<boolean> {
  if (!config.apiKey || toEmails.length === 0) {
    console.log('Email notification skipped: no API key or recipients');
    return false;
  }

  try {
    const emailHtml = generateBookingEmailHtml(bookingData);
    const emailText = generateBookingEmailText(bookingData);

    // 依序寄送，並在每封之間加入短暫延時，避免觸發 Resend 2 rps 的速率限制
    const results: Array<{ email: string; success: boolean }> = [];
    for (const email of toEmails) {
      let attempt = 0;
      let sent = false;
      let lastError: any = null;

      while (attempt < 3 && !sent) {
        attempt++;
        const emailStartTime = Date.now();
        try {
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${config.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: `${config.fromName} <${config.fromEmail}>`,
              to: email,
              subject: `🎉 新訂單通知 - ${bookingData.guestName}`,
              html: emailHtml,
              text: emailText,
            }),
          });
          
          if (response.ok) {
            const emailDuration = Date.now() - emailStartTime;
            const responseData = await response.json();
            
            serviceLogger.log({
              service: 'email',
              action: 'send_notification',
              status: 'success',
              message: `Booking notification email sent to ${email}`,
              duration: emailDuration,
              userId: email,
              details: {
                bookingId: bookingData.bookingId,
                guestName: bookingData.guestName,
                emailId: responseData.id,
              },
            });
            
            console.log(`Booking notification email sent successfully to ${email}`);
            results.push({ email, success: true });
            sent = true;
            break;
          }

          const errorText = await response.text();
          const emailDuration = Date.now() - emailStartTime;
          
          // 若 429，採用簡單退避重試
          if (response.status === 429) {
            const backoffMs = attempt * 1000; // 1s, 2s, 3s
            
            serviceLogger.log({
              service: 'email',
              action: 'send_notification',
              status: 'warning',
              message: `Rate limit (429) when sending to ${email}, retrying in ${backoffMs}ms`,
              duration: emailDuration,
              userId: email,
              details: {
                attempt,
                bookingId: bookingData.bookingId,
              },
            });
            
            console.warn(`Resend rate limit (429) when sending to ${email}. Retrying in ${backoffMs}ms...`);
            await new Promise((r) => setTimeout(r, backoffMs));
            continue;
          }

          serviceLogger.log({
            service: 'email',
            action: 'send_notification',
            status: 'error',
            message: `Email send failed to ${email}`,
            duration: emailDuration,
            userId: email,
            details: {
              status: response.status,
              error: errorText,
              attempt,
              bookingId: bookingData.bookingId,
            },
          });
          
          console.error(`Email send failed to ${email}:`, errorText);
          results.push({ email, success: false });
          sent = false;
          break;
        } catch (error) {
          lastError = error;
          
          serviceLogger.log({
            service: 'email',
            action: 'send_notification',
            status: 'error',
            message: `Error sending email to ${email} (attempt ${attempt})`,
            userId: email,
            details: {
              attempt,
              error: error instanceof Error ? error.message : String(error),
              bookingId: bookingData.bookingId,
            },
          });
          
          console.error(`Error sending email to ${email} (attempt ${attempt}):`, error);
          const backoffMs = attempt * 1000; // 1s, 2s, 3s
          await new Promise((r) => setTimeout(r, backoffMs));
        }
      }

      if (!sent) {
        results.push({ email, success: false });
        if (lastError) {
          console.error(`Giving up sending to ${email} after ${attempt} attempts. Last error:`, lastError);
        }
      }

      // 在每封之間暫停 600ms，避免峰值超過 2 req/s
      await new Promise((r) => setTimeout(r, 600));
    }

    const successCount = results.filter(r => r.success).length;
    
    serviceLogger.log({
      service: 'email',
      action: 'send_notification',
      status: successCount > 0 ? 'success' : 'error',
      message: `Sent ${successCount}/${toEmails.length} notification emails`,
      details: {
        bookingId: bookingData.bookingId,
        totalRecipients: toEmails.length,
        successCount,
        failedCount: toEmails.length - successCount,
      },
    });
    
    console.log(`Sent ${successCount}/${toEmails.length} emails successfully`);
    return successCount > 0;
  } catch (error) {
    serviceLogger.log({
      service: 'email',
      action: 'send_notification',
      status: 'error',
      message: 'Error in sendBookingNotification',
      details: {
        error: error instanceof Error ? error.message : String(error),
        bookingId: bookingData.bookingId,
      },
    });
    
    console.error('Error sending email:', error);
    return false;
  }
}

function generateBookingEmailHtml(data: BookingNotificationData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .booking-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #eee; }
    .info-label { font-weight: bold; width: 140px; color: #666; }
    .info-value { flex: 1; color: #333; }
    .price { font-size: 24px; font-weight: bold; color: #667eea; text-align: center; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🎉 新訂單通知</h1>
      <p style="margin: 10px 0 0 0;">您有一筆新的訂房訂單</p>
    </div>
    <div class="content">
      <div class="booking-info">
        <div class="info-row">
          <div class="info-label">客人姓名：</div>
          <div class="info-value">${data.guestName}</div>
        </div>
        <div class="info-row">
          <div class="info-label">聯絡電話：</div>
          <div class="info-value">${data.contactPhone}</div>
        </div>
        <div class="info-row">
          <div class="info-label">LINE ID：</div>
          <div class="info-value">${data.lineName}</div>
        </div>
        <div class="info-row">
          <div class="info-label">入住日期：</div>
          <div class="info-value">${data.checkInDate}</div>
        </div>
        <div class="info-row">
          <div class="info-label">退房日期：</div>
          <div class="info-value">${data.checkOutDate}</div>
        </div>
        <div class="info-row">
          <div class="info-label">入住人數：</div>
          <div class="info-value">${data.numberOfGuests} 人</div>
        </div>
        <div class="info-row" style="border-bottom: none;">
          <div class="info-label">訂單時間：</div>
          <div class="info-value">${new Date(data.createdAt).toLocaleString('zh-TW')}</div>
        </div>
      </div>
      <div class="price">
        總金額：NT$ ${data.totalPrice.toLocaleString()}
      </div>
      ${data.viewUrl ? `
      <div style="text-align:center; margin: 24px 0;">
        <a href="${data.viewUrl}" style="display:inline-block; background:#3b82f6; color:#fff; text-decoration:none; padding:12px 20px; border-radius:8px; font-weight:bold;">🔎 查閱訂單</a>
      </div>
      ` : ''}
      <p style="text-align: center; color: #666;">
        請儘快聯繫客人確認訂單詳情
      </p>
    </div>
    <div class="footer">
      <p>此為系統自動發送的通知郵件，請勿直接回覆</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function generateBookingEmailText(data: BookingNotificationData): string {
  return `
🎉 新訂單通知

您有一筆新的訂房訂單

訂單資訊：
--------------
客人姓名：${data.guestName}
聯絡電話：${data.contactPhone}
LINE ID：${data.lineName}
入住日期：${data.checkInDate}
退房日期：${data.checkOutDate}
入住人數：${data.numberOfGuests} 人
總金額：NT$ ${data.totalPrice.toLocaleString()}
訂單時間：${new Date(data.createdAt).toLocaleString('zh-TW')}

${data.viewUrl ? `查閱訂單：${data.viewUrl}\n\n` : ''}請儘快聯繫客人確認訂單詳情。

---
此為系統自動發送的通知郵件，請勿直接回覆
  `.trim();
}

/**
 * 發送訂單確認信給客戶
 */
export async function sendCustomerConfirmationEmail(
  config: EmailConfig,
  customerEmail: string,
  bookingData: BookingNotificationData
): Promise<boolean> {
  if (!config.apiKey || !customerEmail) {
    console.log('Customer confirmation email skipped: no API key or recipient');
    return false;
  }

  try {
    const emailHtml = generateCustomerConfirmationHtml(bookingData);
    const emailText = generateCustomerConfirmationText(bookingData);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${config.fromName} <${config.fromEmail}>`,
        to: customerEmail,
        subject: `🎉 訂房成功確認 - Blessing Haven`,
        html: emailHtml,
        text: emailText,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Customer confirmation email send failed:', error);
      return false;
    }

    console.log('Customer confirmation email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending customer confirmation email:', error);
    return false;
  }
}

function generateCustomerConfirmationHtml(data: BookingNotificationData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 40px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .booking-info { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; }
    .info-row { display: flex; padding: 12px 0; border-bottom: 1px solid #eee; }
    .info-label { font-weight: bold; width: 120px; color: #666; }
    .info-value { flex: 1; color: #333; }
    .price-highlight { font-size: 28px; font-weight: bold; color: #f59e0b; text-align: center; margin: 25px 0; padding: 20px; background: #fff9e6; border-radius: 8px; }
    .payment-info { background: #fff9e6; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #fbbf24; }
    .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 32px;">🎉 訂房成功！</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px;">感謝您選擇 Blessing Haven</p>
    </div>
    <div class="content">
      <p style="font-size: 16px; color: #666;">親愛的 <strong>${data.guestName}</strong>：</p>
      <p style="color: #666;">我們已經收到您的訂房預訂，以下是您的訂單詳情：</p>
      
      <div class="booking-info">
        <div class="info-row">
          <div class="info-label">入住日期：</div>
          <div class="info-value">${data.checkInDate}</div>
        </div>
        <div class="info-row">
          <div class="info-label">退房日期：</div>
          <div class="info-value">${data.checkOutDate}</div>
        </div>
        <div class="info-row">
          <div class="info-label">入住人數：</div>
          <div class="info-value">${data.numberOfGuests} 人</div>
        </div>
        <div class="info-row" style="border-bottom: none;">
          <div class="info-label">聯絡電話：</div>
          <div class="info-value">${data.contactPhone}</div>
        </div>
      </div>
      
      <div class="price-highlight">
        總金額：NT$ ${data.totalPrice.toLocaleString()}
      </div>
      
      <div class="booking-info">
        <h3 style="margin-top: 0; color: #0f766e;">📌 入住提醒事項</h3>
        <ul style="margin: 8px 0 0 20px; color: #444;">
          <li>入住時間 14:30 後，退房時間 11:00 前。</li>
          <li>室內全面禁菸，請保持空間整潔。</li>
          <li>為維護寧靜，請晚上九點後輕聲細語。</li>
          <li>攜帶孩童請注意安全，勿於陽台攀爬或奔跑。</li>
          <li>請愛護室內家具與設備，若有損害需照價賠償。</li>
          <li>若有人詢問是否為住戶，請回答是房主親友，並保護個資勿透漏住址。</li>
        </ul>
      </div>

      <div class="payment-info">
        <h3 style="margin-top: 0; color: #d97706;">💰 付款資訊</h3>
        <p style="margin: 8px 0;"><strong>金融機構：</strong> 951</p>
        <p style="margin: 8px 0;"><strong>銀行帳號：</strong> 59801119003897</p>
        <p style="margin: 15px 0 8px 0; color: #d97706;">⚠️ 請於三日內完成匯款</p>
        <p style="margin: 8px 0; font-size: 14px; color: #666;">完成匯款後，請傳送轉帳後五碼或截圖至 LINE 官方帳號</p>
      </div>

      <div style="text-align:center; margin: 24px 0;">
        <a href="https://lin.ee/AIhqwPU1" style="display:inline-block; background:#22c55e; color:#fff; text-decoration:none; padding:12px 20px; border-radius:8px; font-weight:bold;">加入 LINE 收取最新消息</a>
      </div>
      
      <p style="text-align: center; color: #666; margin: 20px 0;">
        期待您的蒞臨，祝您旅途愉快！<br>
        祝福海灣團隊
      </p>
    </div>
    <div class="footer">
      <p>此為系統自動發送的確認郵件，如有任何問題，請聯繫我們</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function generateCustomerConfirmationText(data: BookingNotificationData): string {
  return `
🎉 訂房成功！

感謝您選擇 Blessing Haven

親愛的 ${data.guestName}：

我們已經收到您的訂房預訂，以下是您的訂單詳情：

訂單資訊：
--------------
入住日期：${data.checkInDate}
退房日期：${data.checkOutDate}
入住人數：${data.numberOfGuests} 人
聯絡電話：${data.contactPhone}

總金額：NT$ ${data.totalPrice.toLocaleString()}

加入 LINE 收取最新消息：
https://lin.ee/AIhqwPU1

📌 入住提醒事項：
- 入住時間 14:30 後，退房時間 11:00 前。
- 室內全面禁菸，請保持空間整潔。
- 為維護寧靜，請晚上九點後輕聲細語。
- 攜帶孩童請注意安全，勿於陽台攀爬或奔跑。
- 請愛護室內家具與設備，若有損害需照價賠償。
- 若有人詢問是否為住戶，請回答是房主親友，並保護個資勿透漏住址。

💰 付款資訊：
金融機構：951
銀行帳號：59801119003897

⚠️ 請於三日內完成匯款
完成匯款後，請傳送轉帳後五碼或截圖至 LINE 官方帳號

期待您的蒞臨，祝您旅途愉快！
祝福海灣團隊

---
此為系統自動發送的確認郵件，如有任何問題，請聯繫我們
  `.trim();
}

