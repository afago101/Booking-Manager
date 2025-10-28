// Authentication middleware

import { Context, Next } from 'hono';
import { errorResponse } from '../utils/helpers';
import { SheetsService } from '../utils/sheets';

export async function adminAuthMiddleware(c: Context, next: Next): Promise<Response | void> {
  const adminKey = c.req.header('x-admin-key');
  
  if (!adminKey) {
    return errorResponse('Unauthorized: Missing admin key', 'UNAUTHORIZED', 401);
  }

  // 優先從 Google Sheets 讀取密碼
  try {
    const sheets = new SheetsService(
      c.env.GOOGLE_SHEETS_ID,
      c.env.GOOGLE_CLIENT_EMAIL,
      c.env.GOOGLE_PRIVATE_KEY
    );
    
    const passwordFromSheet = await sheets.getConfigValue('adminPassword');
    
    if (passwordFromSheet && adminKey === passwordFromSheet) {
      await next();
      return;
    }
  } catch (error) {
    console.error('Failed to read password from sheets:', error);
  }

  // 備用：檢查環境變數
  const envKey = c.env.ADMIN_API_KEY;
  if (envKey && adminKey === envKey) {
    await next();
    return;
  }

  return errorResponse('Unauthorized: Invalid admin key', 'UNAUTHORIZED', 401);
}

