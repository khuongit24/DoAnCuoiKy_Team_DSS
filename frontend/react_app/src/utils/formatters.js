/**
 * Format a number to VND currency string
 * @param {number} value - The amount to format
 * @returns {string} Formatted string (e.g., "1.234.567 ₫")
 */
export const formatVND = (value) => {
  if (value === null || value === undefined) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);
};

/**
 * Format a number to percentage string
 * @param {number} value - The value to format (e.g., 0.15 for 15%)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted string (e.g., "15,0%")
 */
export const formatPercent = (value, decimals = 1) => {
  if (value === null || value === undefined) return '0%';
  return new Intl.NumberFormat('vi-VN', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Format a date to Vietnamese locale string
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted string (e.g., "15/07/2026")
 */
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
};

/**
 * Format a number with thousands separators
 * @param {number} value - The number to format
 * @returns {string} Formatted string (e.g., "1.234")
 */
export const formatNumber = (value) => {
  if (value === null || value === undefined) return '0';
  return new Intl.NumberFormat('vi-VN').format(value);
};
