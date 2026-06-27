import moment from 'moment-timezone';

const TIMEZONE = 'Asia/Kolkata';

/**
 * Get current moment in IST
 */
export const getNowIST = () => {
  return moment().tz(TIMEZONE);
};

/**
 * Get current date in YYYY-MM-DD format in IST
 */
export const getTodayIST = () => {
  return getNowIST().format('YYYY-MM-DD');
};

/**
 * Parse YYYY-MM-DD and HH:MM into a Javascript Date object in IST
 * @param {string} dateStr - e.g. "2026-06-27"
 * @param {string} timeStr - e.g. "14:30"
 */
export const parseISTTime = (dateStr, timeStr) => {
  return moment.tz(`${dateStr} ${timeStr}`, 'YYYY-MM-DD HH:mm', TIMEZONE).toDate();
};

/**
 * Formats a Date object as a string in Asia/Kolkata
 */
export const formatIST = (date, formatStr = 'YYYY-MM-DD HH:mm:ss') => {
  return moment(date).tz(TIMEZONE).format(formatStr);
};

/**
 * Format a Date object to YYYY-MM-DD in IST
 */
export const toISTDateString = (date) => {
  return moment(date).tz(TIMEZONE).format('YYYY-MM-DD');
};

/**
 * Get difference in minutes between two dates
 */
export const getDiffMinutes = (start, end) => {
  return moment(end).diff(moment(start), 'minutes');
};

/**
 * Check if the current time is in the last 5 minutes of a task duration
 * Task end is the Date object representing task completion deadline
 */
export const isWithinLastFiveMinutes = (scheduledEnd) => {
  const now = getNowIST();
  const end = moment(scheduledEnd);
  
  // Last 5 minutes means: end - 5 minutes <= now <= end
  const startWindow = moment(end).subtract(5, 'minutes');
  
  return now.isSameOrAfter(startWindow) && now.isSameOrBefore(end);
};

/**
 * Check if a task has expired (current time has passed its scheduled end time)
 */
export const isPastEndTime = (scheduledEnd) => {
  const now = getNowIST();
  return now.isAfter(moment(scheduledEnd));
};
