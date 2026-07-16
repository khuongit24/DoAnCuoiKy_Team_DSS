import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';

describe('API Service', () => {
  it('should have correct base URL', () => {
    expect(api.defaults.baseURL).toBeDefined();
  });

  it('should have request interceptor for auth token', () => {
    const interceptor = api.interceptors.request.handlers.length;
    expect(interceptor).toBeGreaterThan(0);
  });

  it('should have response interceptor for error handling', () => {
    const interceptor = api.interceptors.response.handlers.length;
    expect(interceptor).toBeGreaterThan(0);
  });
});
