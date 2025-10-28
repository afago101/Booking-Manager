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
    const emailHtml = generateBookingEmailHtml(bookingData);
    const emailText = generateBookingEmailText(bookingData);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${config.fromName} <${config.fromEmail}>`,
        to: toEmails,
        subject: `🎉 新訂單通知 - ${bookingData.guestName}`,
        html: emailHtml,
        text: emailText,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Email send failed:', error);
      return false;
    }

    console.log('Booking notification email sent successfully');
    return true;
  } catch (error) {
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

