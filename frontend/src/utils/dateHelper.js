/**
 * Get current date in YYYY-MM-DD format in the Asia/Kolkata timezone
 */
export const getTodayIST = () => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now);
};
