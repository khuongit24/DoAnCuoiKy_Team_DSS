import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dataService } from './dataService';
import api from './api';

vi.mock('./api');

describe('dataService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAll should call api.get with entity and params', async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    await dataService.getAll('products', { page: 1 });
    expect(api.get).toHaveBeenCalledWith('/products', { params: { page: 1 } });
  });

  it('getById should call api.get with entity and id', async () => {
    api.get.mockResolvedValueOnce({ data: {} });
    await dataService.getById('products', 1);
    expect(api.get).toHaveBeenCalledWith('/products/1');
  });

  it('create should call api.post with entity and data', async () => {
    api.post.mockResolvedValueOnce({ data: {} });
    await dataService.create('products', { name: 'Test' });
    expect(api.post).toHaveBeenCalledWith('/products', { name: 'Test' });
  });

  it('update should call api.put with entity, id and data', async () => {
    api.put.mockResolvedValueOnce({ data: {} });
    await dataService.update('products', 1, { name: 'Test 2' });
    expect(api.put).toHaveBeenCalledWith('/products/1', { name: 'Test 2' });
  });

  it('delete should call api.delete with entity and id', async () => {
    api.delete.mockResolvedValueOnce({ data: {} });
    await dataService.delete('products', 1);
    expect(api.delete).toHaveBeenCalledWith('/products/1');
  });

  it('importCSV should call api.post with FormData', async () => {
    api.post.mockResolvedValueOnce({ data: {} });
    const file = new File([''], 'test.csv', { type: 'text/csv' });
    await dataService.importCSV('products', file);
    expect(api.post).toHaveBeenCalledWith('/products/import', expect.any(FormData), {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  });

  it('getSalesByProduct should call api.get', async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    await dataService.getSalesByProduct(1, { range: 'month' });
    expect(api.get).toHaveBeenCalledWith('/sales/by-product/1', { params: { range: 'month' } });
  });
});
