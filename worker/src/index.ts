// Main Worker entry point

import { Hono } from 'hono';
import { Env } from './types';
import { SheetsService } from './utils/sheets';
import { corsMiddleware } from './middleware/cors';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { adminAuthMiddleware } from './middleware/auth';
import {
  handleGetAvailability,
  handleQuote,
  handleCreateBooking,
} from './handlers/public';
import {
  handleGetBookings,
  handleUpdateBooking,
  handleDeleteBooking,
  handleGetInventory,
  handleUpdateInventory,
  handleGetSettings,
  handleUpdateSettings,
} from './handlers/admin';
import { errorResponse } from './utils/helpers';

const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', corsMiddleware);
app.use('*', rateLimitMiddleware);

// Initialize Sheets service for each request
app.use('*', async (c, next) => {
  try {
    const sheets = new SheetsService(
      c.env.GOOGLE_SHEETS_ID,
      c.env.GOOGLE_CLIENT_EMAIL,
      c.env.GOOGLE_PRIVATE_KEY
    );
    c.set('sheets', sheets);
    await next();
  } catch (error: any) {
    console.error('Error initializing sheets service:', error);
    return errorResponse('Service initialization failed', 'INTERNAL_ERROR', 500);
  }
});

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// === PUBLIC ENDPOINTS ===

app.get('/api/availability', handleGetAvailability);
app.post('/api/quote', handleQuote);
app.post('/api/bookings', handleCreateBooking);

// === ADMIN ENDPOINTS ===

// Admin middleware for protected routes
app.use('/api/admin/*', adminAuthMiddleware);

app.get('/api/admin/bookings', handleGetBookings);
app.patch('/api/admin/bookings/:id', handleUpdateBooking);
app.delete('/api/admin/bookings/:id', handleDeleteBooking);

app.get('/api/admin/inventory', handleGetInventory);
app.put('/api/admin/inventory/:date', handleUpdateInventory);

app.get('/api/admin/settings', handleGetSettings);
app.put('/api/admin/settings', handleUpdateSettings);

// === INITIALIZATION ENDPOINT ===

app.post('/api/admin/initialize', async (c) => {
  try {
    const sheets = c.get('sheets') as SheetsService;
    await sheets.initializeSheets();
    return c.json({ message: 'Sheets initialized successfully' });
  } catch (error: any) {
    console.error('Error initializing sheets:', error);
    return errorResponse(error.message || 'Failed to initialize sheets', 'INTERNAL_ERROR', 500);
  }
});

// === FALLBACK ===

app.notFound((c) => {
  return errorResponse('Endpoint not found', 'NOT_FOUND', 404);
});

app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return errorResponse(err.message || 'Internal server error', 'INTERNAL_ERROR', 500);
});

export default app;

