/**
 * Small validation helpers used by controllers. They throw an Error with a
 * `status` and `expose` flag so the central error handler returns a clean 400.
 */

function httpError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  err.expose = true;
  return err;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_RE.test(email.trim());
}

/**
 * Validate an ISO date string (YYYY-MM-DD) and ensure it is a real calendar date.
 */
function isValidDate(value) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/**
 * Parse and validate a positive monetary amount. Returns a Number.
 */
function parsePositiveAmount(value, fieldName = 'amount') {
  const num = Number(value);
  if (value === undefined || value === null || value === '' || Number.isNaN(num)) {
    throw httpError(`${fieldName} is required and must be a number`);
  }
  if (num <= 0) {
    throw httpError(`${fieldName} must be a positive number`);
  }
  return num;
}

/**
 * Parse and validate an integer within an inclusive range.
 */
function parseIntInRange(value, fieldName, min, max) {
  const num = Number(value);
  if (!Number.isInteger(num) || num < min || num > max) {
    throw httpError(`${fieldName} must be an integer between ${min} and ${max}`);
  }
  return num;
}

module.exports = {
  httpError,
  isValidEmail,
  isValidDate,
  parsePositiveAmount,
  parseIntInRange,
};
