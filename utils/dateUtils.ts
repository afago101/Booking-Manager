// utils/dateUtils.ts

/**
 * Formats a Date object into a 'YYYY-MM-DD' string, ignoring timezone.
 * This is the standardized way to handle dates across the app to prevent timezone issues.
 * @param date The Date object to format.
 * @returns The formatted date string.
 */
export const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};


/**
 * Generates an array of date strings (YYYY-MM-DD) between a start and end date.
 * The end date is exclusive.
 * This implementation avoids using toISOString() to prevent timezone conversion issues.
 * @param startDate The start date.
 * @param endDate The end date.
 * @returns An array of date strings.
 */
export const getDatesInRange = (startDate: Date, endDate: Date): string[] => {
  const dates = [];
  // Create a new Date object to avoid modifying the original
  let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  
  while (currentDate < endDate) {
    dates.push(formatDateToYYYYMMDD(currentDate));
    
    // Increment the date
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

/**
 * Formats a date string (YYYY-MM-DD) into a format suitable for iCalendar (YYYYMMDD).
 * @param dateStr The date string to format.
 * @returns The formatted date string.
 */
export const formatICalDate = (dateStr: string): string => {
  return dateStr.replace(/-/g, '');
};