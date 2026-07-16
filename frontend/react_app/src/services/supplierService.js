import api from './api';

export const supplierService = {
  getRanking: (productId) => 
    api.get(`/suppliers/ranking`, { params: { productId } }),
  
  configureWeights: (data) => 
    api.post('/suppliers/configure-weights', data),
  
  evaluateSupplier: (suppliers, weights, criteriaTypes) => 
    api.post('/suppliers/evaluate', { suppliers, weights, criteriaTypes })
};
