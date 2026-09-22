import api from './api';

export const trashApi = {
  getTrash: async (type = '') => {
    const res = await api.get(`/trash${type ? `?type=${type}` : ''}`);
    return res.data;
  },

  restoreItem: async (type, id) => {
    const res = await api.put(`/trash/${type}/${id}/restore`);
    return res.data;
  },

  hardDeleteItem: async (type, id) => {
    const res = await api.delete(`/trash/${type}/${id}`);
    return res.data;
  },

  emptyTrash: async () => {
    const res = await api.delete('/trash/empty');
    return res.data;
  }
};
