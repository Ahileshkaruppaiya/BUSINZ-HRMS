export const toNum = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'string' && value.trim() !== '') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

/**
 * Formats any amount to the Indian Numbering System with strictly 2 decimal places (e.g. ₹0.00, ₹2,000.00).
 */
export const formatCurrency = (value: unknown, showSymbol = true): string => {
  const num = toNum(value, 0);
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const formatted = absNum.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (showSymbol) {
    return isNegative ? `-₹${formatted}` : `₹${formatted}`;
  }
  return isNegative ? `-${formatted}` : formatted;
};

export const formatINR = (value: unknown, showSymbol = true): string => formatCurrency(value, showSymbol);
export const formatAmount = (value: unknown, showSymbol = true): string => formatCurrency(value, showSymbol);