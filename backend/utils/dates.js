// utils/dates.js

/**
 * Returns today's date as YYYY-MM-DD
 */
function getToday() {
  return formatDate(new Date());
}

/**
 * Returns tomorrow's date as YYYY-MM-DD
 */
function getTomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return formatDate(date);
}

/**
 * Converts "today" or "tomorrow" from the frontend
 * into an actual database date.
 */
function resolveDay(day) {
  switch (day) {
    case 'tomorrow':
      return getTomorrow();

    case 'today':
    default:
      return getToday();
  }
}

/**
 * Converts a Date object into YYYY-MM-DD
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Returns true if a stored booking date
 * is older than the given number of days.
 */
function isOlderThan(dateString, days) {
  const bookingDate = new Date(dateString);
  const now = new Date();

  const diffMs = now - bookingDate;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays > days;
}

module.exports = {
  getToday,
  getTomorrow,
  resolveDay,
  formatDate,
  isOlderThan,
};