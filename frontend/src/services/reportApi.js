import api from './api';

export const reportApi = {
  getStockReport: async (params = {}) => {
    const res = await api.get('/reports/stock', { params });
    return res.data;
  },
  getSalesReport: async (params = {}) => {
    const res = await api.get('/reports/sales', { params });
    return res.data;
  },
  getPurchaseReport: async (params = {}) => {
    const res = await api.get('/reports/purchases', { params });
    return res.data;
  },
  getMovementReport: async (params = {}) => {
    const res = await api.get('/reports/movements', { params });
    return res.data;
  },
  downloadExport: async (type, format, params = {}) => {
    const res = await api.get(`/reports/${type}`, {
      params: { ...params, export: format },
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `${type}-report.${format === 'excel' ? 'xlsx' : 'pdf'}`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};
