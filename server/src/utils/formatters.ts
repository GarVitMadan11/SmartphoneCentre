/**
 * Formatter utilities for Rephonix Server
 */

/**
 * Formats a numeric price into INR currency string.
 * e.g., 55000 -> "₹55,000"
 */
export function formatPrice(price: number): string {
  if (typeof price !== 'number' || isNaN(price)) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Formats a date string, timestamp or Date instance into Indian localized date string.
 * e.g., "2026-08-21T14:00:00.000Z" -> "21/08/2026"
 */
export function formatDate(date: string | Date | number): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (!d || isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN');
}

/**
 * Formats storage capacity in GB / TB.
 * e.g., 256 -> "256GB", 1024 -> "1TB", 2048 -> "2TB"
 */
export function formatStorage(storageGb: number): string {
  if (!storageGb || isNaN(storageGb)) return '';
  if (storageGb >= 1024) {
    const tb = storageGb / 1024;
    return Number.isInteger(tb) ? `${tb}TB` : `${tb.toFixed(1)}TB`;
  }
  return `${storageGb}GB`;
}
