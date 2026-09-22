import api from './api';

export const inventoryApi = {
  getInventory: async (params = {}) => {
    const res = await api.get('/inventory', { params });
    return res.data;
  },
  getVariantInventory: async (variantId) => {
    const res = await api.get(`/inventory/${variantId}`);
    return res.data;
  },
  stockIn: async (data) => {
    const res = await api.post('/inventory/stock-in', data);
    return res.data;
  },
  stockOut: async (data) => {
    const res = await api.post('/inventory/stock-out', data);
    return res.data;
  },
  getMovements: async (params = {}) => {
    const res = await api.get('/inventory/movements', { params });
    return res.data;
  },
  globalSearch: async (q) => {
    const res = await api.get('/inventory/search', { params: { q } });
    return res.data;
  },
  getDashboardSummary: async () => {
    const res = await api.get('/inventory/dashboard');
    return res.data;
  }
};
