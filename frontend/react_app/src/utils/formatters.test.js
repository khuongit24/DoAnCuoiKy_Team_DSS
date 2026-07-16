import { describe, it, expect } from 'vitest';
import { formatVND, formatPercent, formatDate, formatNumber } from './formatters';

describe('formatters', () => {
  describe('formatVND', () => {
    it('should format number to VND currency', () => {
      const result = formatVND(1234567);
      expect(result).toMatch(/1\.234\.567/);
      expect(result).toMatch(/₫|VND/);
    });

    it('should handle null/undefined', () => {
      expect(formatVND(null)).toMatch(/0/);
      expect(formatVND(undefined)).toMatch(/0/);
    });
  });

  describe('formatPercent', () => {
    it('should format decimal to percent string', () => {
      const result = formatPercent(0.15);
      expect(result).toMatch(/15/);
      expect(result).toMatch(/%/);
    });

    it('should handle custom decimals', () => {
      const result = formatPercent(0.155, 2);
      expect(result).toMatch(/15,50|15\.50/);
    });

    it('should handle null/undefined', () => {
      expect(formatPercent(null)).toMatch(/0/);
    });
  });

  describe('formatDate', () => {
    it('should format date string correctly', () => {
      const result = formatDate('2026-07-15T00:00:00Z');
      expect(result).toMatch(/15\/07\/2026/);
    });

    it('should handle invalid date', () => {
      expect(formatDate('invalid')).toBe('');
      expect(formatDate(null)).toBe('');
    });
  });

  describe('formatNumber', () => {
    it('should format number with thousands separators', () => {
      const result = formatNumber(1234);
      expect(result).toMatch(/1\.234/);
    });

    it('should handle null/undefined', () => {
      expect(formatNumber(null)).toBe('0');
    });
  });
});
