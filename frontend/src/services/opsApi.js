import api from './api';

export const returnApi = {
  getReturns: async (params = {}) => {
    const res = await api.get('/returns', { params });
    return res.data;
  },
  createReturn: async (data) => {
    const res = await api.post('/returns', data);
    return res.data;
  }
};

export const adjustmentApi = {
  getAdjustments: async (params = {}) => {
    const res = await api.get('/adjustments', { params });
    return res.data;
  },
  createAdjustment: async (data) => {
    const res = await api.post('/adjustments', data);
    return res.data;
  },
  approveAdjustment: async (id) => {
    const res = await api.patch(`/adjustments/${id}/approve`);
    return res.data;
  },
  rejectAdjustment: async (id) => {
    const res = await api.patch(`/adjustments/${id}/reject`);
    return res.data;
  }
};

export const vendorApi = {
  getVendors: async (params = {}) => {
    const res = await api.get('/vendors', { params });
    return res.data;
  },
  getVendorById: async (id) => {
    const res = await api.get(`/vendors/${id}`);
    return res.data;
  },
  createVendor: async (data) => {
    const res = await api.post('/vendors', data);
    return res.data;
  },
  updateVendor: async (id, data) => {
    const res = await api.put(`/vendors/${id}`, data);
    return res.data;
  },
  deleteVendor: async (id) => {
    const res = await api.delete(`/vendors/${id}`);
    return res.data;
  }
};

export const locationApi = {
  getLocations: async () => {
    const res = await api.get('/locations');
    return res.data;
  },
  createLocation: async (data) => {
    const res = await api.post('/locations', data);
    return res.data;
  },
  updateLocation: async (id, data) => {
    const res = await api.put(`/locations/${id}`, data);
    return res.data;
  },
  deleteLocation: async (id) => {
    const res = await api.delete(`/locations/${id}`);
    return res.data;
  }
};

export const userApi = {
  getUsers: async () => {
    const res = await api.get('/users');
    return res.data;
  },
  createUser: async (data) => {
    const res = await api.post('/users', data);
    return res.data;
  },
  updateUser: async (id, data) => {
    const res = await api.put(`/users/${id}`, data);
    return res.data;
  },
  updateStatus: async (id, status) => {
    const res = await api.patch(`/users/${id}/status`, { status });
    return res.data;
  }
};
