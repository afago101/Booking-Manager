// Email notification utilities

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
    console.log('📧 Generating email content...');
    const emailHtml = generateBookingEmailHtml(bookingData);
    const emailText = generateBookingEmailText(bookingData);
    console.log('📧 Email content generated successfully');

    // 一次性發送給所有收件人（Resend API 支援在 to 欄位中使用陣列）
    console.log(`📧 Sending notification email to ${toEmails.length} recipients: ${toEmails.join(', ')}`);
    
    const emailPayload = {
      from: `${config.fromName} <${config.fromEmail}>`,
      to: toEmails, // 一次性發送給所有收件人（陣列格式）
      subject: `🎉 新訂單通知 - ${bookingData.guestName}`,
      html: emailHtml,
      text: emailText,
    };

    console.log('📧 Email payload:', {
      from: emailPayload.from,
      to: emailPayload.to,
      subject: emailPayload.subject,
      htmlLength: emailHtml.length,
      textLength: emailText.length,
    });
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    console.log('📧 API response status:', response.status);
    const responseData = await response.json().catch(() => null);
    console.log('📧 API response data:', responseData);
    
    if (!response.ok) {
      const errorMsg = responseData?.message || await response.text().catch(() => 'Unknown error');
      console.error(`❌ Email send failed:`, response.status, errorMsg);
      return false;
    }

    console.log(`✅ Email notification sent successfully to all ${toEmails.length} recipients`);
    if (responseData?.id) {
      console.log(`Email ID: ${responseData.id}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
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
          <div class="info-label">訂單編號：</div>
          <div class="info-value">${data.bookingId}</div>
        </div>
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
訂單編號：${data.bookingId}
客人姓名：${data.guestName}
聯絡電話：${data.contactPhone}
LINE ID：${data.lineName}
入住日期：${data.checkInDate}
退房日期：${data.checkOutDate}
入住人數：${data.numberOfGuests} 人
總金額：NT$ ${data.totalPrice.toLocaleString()}
訂單時間：${new Date(data.createdAt).toLocaleString('zh-TW')}

請儘快聯繫客人確認訂單詳情。

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
          <div class="info-label">訂單編號：</div>
          <div class="info-value">${data.bookingId}</div>
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
          <div class="info-label">聯絡電話：</div>
          <div class="info-value">${data.contactPhone}</div>
        </div>
      </div>
      
      <div class="price-highlight">
        總金額：NT$ ${data.totalPrice.toLocaleString()}
      </div>
      
      <div class="payment-info">
        <h3 style="margin-top: 0; color: #d97706;">💰 付款資訊</h3>
        <p style="margin: 8px 0;"><strong>金融機構：</strong> 951</p>
        <p style="margin: 8px 0;"><strong>銀行帳號：</strong> 59801119003897</p>
        <p style="margin: 15px 0 8px 0; color: #d97706;">⚠️ 請於三日內完成匯款</p>
        <p style="margin: 8px 0; font-size: 14px; color: #666;">完成匯款後，請傳送轉帳後五碼或截圖至 LINE 官方帳號</p>
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
訂單編號：${data.bookingId}
入住日期：${data.checkInDate}
退房日期：${data.checkOutDate}
入住人數：${data.numberOfGuests} 人
聯絡電話：${data.contactPhone}

總金額：NT$ ${data.totalPrice.toLocaleString()}

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

