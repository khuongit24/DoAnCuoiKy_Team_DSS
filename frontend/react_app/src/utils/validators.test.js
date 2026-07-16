import { describe, it, expect } from 'vitest';
import { required, email, minLength } from './validators';

describe('validators', () => {
  describe('required', () => {
    it('should return error if value is empty, null or undefined', () => {
      expect(required('')).toBe('Trường này là bắt buộc');
      expect(required(null)).toBe('Trường này là bắt buộc');
      expect(required(undefined)).toBe('Trường này là bắt buộc');
    });

    it('should return null if value is provided', () => {
      expect(required('value')).toBeNull();
      expect(required(0)).toBeNull();
    });
  });

  describe('email', () => {
    it('should return error if email is invalid', () => {
      expect(email('invalid-email')).toBe('Email không hợp lệ');
      expect(email('test@')).toBe('Email không hợp lệ');
      expect(email('test@domain')).toBe('Email không hợp lệ');
    });

    it('should return null if email is valid', () => {
      expect(email('test@example.com')).toBeNull();
    });
    
    it('should return null if empty (should use required for empty check)', () => {
      expect(email('')).toBeNull();
      expect(email(null)).toBeNull();
    });
  });

  describe('minLength', () => {
    it('should return error if value length is less than min', () => {
      const validate = minLength(5);
      expect(validate('1234')).toBe('Độ dài tối thiểu là 5 ký tự');
    });

    it('should return null if value length is equal or greater than min', () => {
      const validate = minLength(5);
      expect(validate('12345')).toBeNull();
      expect(validate('123456')).toBeNull();
    });

    it('should return null if value is empty', () => {
      const validate = minLength(5);
      expect(validate('')).toBeNull();
      expect(validate(null)).toBeNull();
    });
  });
});
