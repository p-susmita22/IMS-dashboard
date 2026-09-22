import api from './api';

export const transferApi = {
  getTransfers: async (params = {}) => {
    const res = await api.get('/transfers', { params });
    return res.data;
  },
  createTransfer: async (data) => {
    const res = await api.post('/transfers', data);
    return res.data;
  }
};
