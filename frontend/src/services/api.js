import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://ims-dashboard-dtbu.onrender.com/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

const cache = new Map();

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ims_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Check cache for GET requests
    if (config.method === 'get') {
      const key = config.url + JSON.stringify(config.params || {});
      if (cache.has(key)) {
        const cached = cache.get(key);
        // Cache valid for 2 minutes
        if (Date.now() - cached.timestamp < 120000) {
          config.adapter = () => Promise.resolve({
            data: cached.data,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            request: {}
          });
        }
      }
    } else {
      // For any mutation (POST, PUT, DELETE), clear the cache to ensure fresh data
      cache.clear();
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    // Save GET responses to cache
    if (response.config.method === 'get') {
      const key = response.config.url + JSON.stringify(response.config.params || {});
      cache.set(key, { data: response.data, timestamp: Date.now() });
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('ims_token');
      localStorage.removeItem('ims_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
