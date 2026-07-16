import api from './api';

export const dataService = {
  getAll: async (entity, params) => {
    const response = await api.get(`/${entity}`, { params });
    return response.data;
  },

  getById: async (entity, id) => {
    const response = await api.get(`/${entity}/${id}`);
    return response.data;
  },

  create: async (entity, data) => {
    const response = await api.post(`/${entity}`, data);
    return response.data;
  },

  update: async (entity, id, data) => {
    const response = await api.put(`/${entity}/${id}`, data);
    return response.data;
  },

  delete: async (entity, id) => {
    const response = await api.delete(`/${entity}/${id}`);
    return response.data;
  },

  importJSON: async (entity, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/${entity}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  getSalesByProduct: async (productId, params) => {
    const response = await api.get(`/sales/by-product/${productId}`, { params });
    return response.data;
  }
};
