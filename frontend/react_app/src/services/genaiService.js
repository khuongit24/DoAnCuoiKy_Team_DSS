import api from './api';

export const genaiService = {
  explain: async (type, productId, context, modelType) => {
    const response = await api.post('/genai/explain', { type, product_id: productId, context, model_type: modelType });
    return response.data;
  },
  
  chat: async (message, conversationId) => {
    const response = await api.post('/genai/chat', { message, conversationId });
    return response.data;
  },

  getHistory: async (page = 1, limit = 10) => {
    const response = await api.get('/genai/history', { params: { page, limit } });
    return response.data;
  }
};
