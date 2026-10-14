/**
 * Utility functions for local date formatting without UTC timezone drift.
 */

/**
 * Returns a date formatted as 'YYYY-MM-DD' using local timezone values.
 * Standard `new Date().toISOString().split('T')[0]` returns UTC date,
 * which shows yesterday's date in timezones ahead of UTC (e.g. IST +05:30 between 00:00 and 05:30 AM).
 */
export const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Formats a date string or Date object to 'DD/MM/YYYY'.
 */
export const formatDisplayDate = (dateVal: string | Date): string => {
  if (!dateVal) return "";
  const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
  if (isNaN(d.getTime())) return String(dateVal);
  return d.toLocaleDateString("en-GB");
};
