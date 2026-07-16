import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from './authService';
import api from './api';

vi.mock('./api');

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('login should call api.post with correct credentials', async () => {
    const mockData = { token: '123' };
    api.post.mockResolvedValueOnce({ data: mockData });

    const result = await authService.login('test@test.com', 'password');
    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'test@test.com', password: 'password' });
    expect(result).toEqual(mockData);
  });

  it('refreshToken should call api.post with refresh token', async () => {
    const mockData = { token: '456' };
    api.post.mockResolvedValueOnce({ data: mockData });

    const result = await authService.refreshToken('old_token');
    expect(api.post).toHaveBeenCalledWith('/auth/refresh-token', { refresh_token: 'old_token' });
    expect(result).toEqual(mockData);
  });

  it('logout should call api.post /auth/logout', async () => {
    api.post.mockResolvedValueOnce({ data: { success: true } });
    const result = await authService.logout();
    expect(api.post).toHaveBeenCalledWith('/auth/logout');
    expect(result).toEqual({ success: true });
  });

  it('me should call api.get /auth/me', async () => {
    const mockData = { id: 1, name: 'User' };
    api.get.mockResolvedValueOnce({ data: mockData });
    const result = await authService.me();
    expect(api.get).toHaveBeenCalledWith('/auth/me');
    expect(result).toEqual(mockData);
  });
});
