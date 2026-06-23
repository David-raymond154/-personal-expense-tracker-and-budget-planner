export function formatCurrency(value) {
  const num = Number(value) || 0;
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function monthName(month) {
  return MONTHS[month - 1] || '';
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function currentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}
