import api from './api';

export const orderApi = {
  getOrders: async (params = {}) => {
    const res = await api.get('/orders', { params });
    return res.data;
  },
  getOrderById: async (id) => {
    const res = await api.get(`/orders/${id}`);
    return res.data;
  },
  createOrder: async (data) => {
    const res = await api.post('/orders', data);
    return res.data;
  },
  updateOrderStatus: async (id, status, notes = '') => {
    const res = await api.patch(`/orders/${id}/status`, { status, notes });
    return res.data;
  },
  deleteOrder: async (id) => {
    const res = await api.delete(`/orders/${id}`);
    return res.data;
  }
};
