// utils/fileGenerators.ts

import { Booking } from '../types';
import { formatICalDate } from './dateUtils';
import { Translations } from './translations';

export const generateICSFile = (booking: Booking, t: Translations['zh'] | Translations['en']) => {
  const eventName = `${t.ics.title}: Blessing Haven - ${booking.guestName}`;
  const startDate = formatICalDate(booking.checkInDate);
  const endDate = formatICalDate(booking.checkOutDate);
  const location = 'Blessing Haven B&B';
  const description = `${t.ics.descriptionPrefix}\\n${t.confirmationPage.guestName}：${booking.guestName}\\n${t.confirmationPage.contactPhone}：${booking.contactPhone}\\n${t.confirmationPage.guests}：${booking.numberOfGuests}\\n${t.confirmationPage.totalPrice}：${booking.totalPrice} ${t.confirmationPage.currency}`;
  
  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BlessingBay//BookingSystem//EN',
    'BEGIN:VEVENT',
    `UID:${booking.id}@blessingbay.com`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:.]/g, '')}Z`,
    `DTSTART;VALUE=DATE:${startDate}`,
    `DTEND;VALUE=DATE:${endDate}`,
    `SUMMARY:${eventName}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `booking-${booking.id}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};