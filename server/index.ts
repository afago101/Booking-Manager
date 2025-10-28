// server/index.ts

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'; // Import for ES Modules __dirname replacement
import { Booking, DailyPrices } from '../types';

const app = express();
const PORT = process.env.PORT || 3001;

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Database path
// The database file will be created in the `dist` folder alongside the compiled server code.
const DB_PATH = path.join(__dirname, 'db.json');

// --- Database Helpers (No changes needed here) ---
interface DbData {
  bookings: Booking[];
  prices: DailyPrices;
  adminPassword: string;
  notificationEmails: string[];
}

const readDb = (): DbData => {
  if (!fs.existsSync(DB_PATH)) {
    console.log(`[DB] No database file found at ${DB_PATH}. Creating a new one.`);
    const initialData: DbData = {
      bookings: [],
      prices: {
        defaultWeekday: 5000,
        defaultWeekend: 7000,
        dates: {},
        closedDates: [],
      },
      adminPassword: 'password', // Default password
      notificationEmails: [],
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(data);
};

const writeDb = (data: DbData): void => {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

const getDatesInRange = (start: string, end: string): string[] => {
    const dates = [];
    let currentDate = new Date(start);
    currentDate = new Date(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate());
    const stopDate = new Date(end);
    const stopDateUTC = new Date(stopDate.getUTCFullYear(), stopDate.getUTCMonth(), stopDate.getUTCDate());
    while (currentDate < stopDateUTC) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};
  
const getUnavailableDatesFromDb = (db: DbData): string[] => {
    const bookedDates = new Set<string>();
    db.bookings.forEach(booking => {
        if (booking.status === 'cancelled') return;
        const dates = getDatesInRange(booking.checkInDate, booking.checkOutDate);
        dates.forEach(date => bookedDates.add(date));
    });
    const closedDates = db.prices.closedDates || [];
    return [...Array.from(bookedDates), ...closedDates];
};

// --- API Endpoints (No changes needed here) ---

app.get('/api/bookings', (req, res) => {
  const db = readDb();
  const sortedBookings = db.bookings.sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime());
  res.json(sortedBookings);
});

app.post('/api/bookings', (req, res) => {
  const db = readDb();
  const { checkInDate, checkOutDate } = req.body;
  const requestedDates = getDatesInRange(checkInDate, checkOutDate);
  const unavailableDates = getUnavailableDatesFromDb(db);
  if (requestedDates.some(date => unavailableDates.includes(date))) {
    return res.status(409).json({ message: 'DATE_CONFLICT' });
  }
  const newBooking: Booking = {
    id: `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
    ...req.body,
  };
  db.bookings.push(newBooking);
  writeDb(db);
  res.status(201).json(newBooking);
});

app.put('/api/bookings/:id', (req, res) => {
  const { id } = req.params;
  const updatedBookingData: Booking = req.body;
  const db = readDb();
  const index = db.bookings.findIndex(b => b.id === id);
  if (index === -1) return res.status(404).json({ message: 'Booking not found' });
  db.bookings[index] = { ...db.bookings[index], ...updatedBookingData };
  writeDb(db);
  res.json(db.bookings[index]);
});

app.delete('/api/bookings/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const initialLength = db.bookings.length;
  db.bookings = db.bookings.filter(b => b.id !== id);
  if (db.bookings.length === initialLength) return res.status(404).json({ message: 'Booking not found' });
  writeDb(db);
  res.status(204).send();
});

app.get('/api/bookings/lookup', (req, res) => {
    const { phone } = req.query;
    if (typeof phone !== 'string') return res.status(400).json({ message: 'Phone number is required' });
    const db = readDb();
    const results = db.bookings.filter(b => b.contactPhone === phone);
    res.json(results);
});

app.get('/api/unavailable-dates', (req, res) => {
  const db = readDb();
  res.json(getUnavailableDatesFromDb(db));
});

app.get('/api/prices', (req, res) => {
  const db = readDb();
  res.json(db.prices);
});

app.post('/api/prices', (req, res) => {
  const newPrices: DailyPrices = req.body;
  const db = readDb();
  db.prices = newPrices;
  writeDb(db);
  res.json(db.prices);
});

app.post('/api/login', (req, res) => {
    const { password } = req.body;
    const db = readDb();
    if (password === db.adminPassword) res.json({ success: true });
    else res.json({ success: false });
});

app.post('/api/admin/password', (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const db = readDb();
    if (currentPassword !== db.adminPassword) return res.status(403).json({ message: 'Incorrect current password' });
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    db.adminPassword = newPassword;
    writeDb(db);
    res.status(204).send();
});

app.get('/api/notifications/emails', (req, res) => {
    const db = readDb();
    res.json(db.notificationEmails);
});

app.post('/api/notifications/emails', (req, res) => {
    const { emails } = req.body;
    if (!Array.isArray(emails)) return res.status(400).json({ message: 'Emails must be an array' });
    const db = readDb();
    db.notificationEmails = emails;
    writeDb(db);
    res.status(204).send();
});

app.post('/api/send-email', (req, res) => {
    const { recipients, subject, body } = req.body;
    console.log('--- MOCK Email Sent ---');
    console.log(`To: ${recipients.join(', ')}, Subject: ${subject}`);
    res.status(200).json({ message: 'Email sent (mocked)' });
});

// --- CORRECTED STATIC FILE SERVING LOGIC ---

// The static files (index.html, etc.) are in the project's root directory.
// From `server/dist/index.js`, the path to the root is two levels up ('../../').
const rootPath = path.join(__dirname, '..', '..');

// Serve static assets (like index.tsx, images, etc.) from the root directory
app.use(express.static(rootPath));

// The "catchall" handler for Single-Page Applications (SPA).
// For any request that doesn't match an API route or a specific static file,
// send back the main index.html file. This allows the frontend router to handle the URL.
app.get('*', (req, res) => {
  // This check prevents API 404s from being served index.html.
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: `API endpoint not found: ${req.method} ${req.path}` });
  }
  
  // For any other path, serve the frontend's entry point.
  res.sendFile(path.join(rootPath, 'index.html'), (err) => {
    if (err) {
      console.error("[Static Serving Error] Could not send index.html:", err);
      res.status(500).send('Error serving the application. Please check server logs.');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Serving static files from: ${rootPath}`);
});
