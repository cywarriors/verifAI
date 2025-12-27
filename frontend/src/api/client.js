import axios from 'axios';
import toast from 'react-hot-toast';

// Use Vite env vars or fallback to backend on 8000
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - add auth token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors globally
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'An error occurred';
    
    // Handle specific error codes
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      
      // Only redirect if not already on auth pages
      if (!window.location.pathname.startsWith('/login') && 
          !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    }
    
    return Promise.reject(error);
  }
);

export default client;

// Auth API
export const authAPI = {
  login: async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    const response = await client.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  },
  
  register: async (userData) => {
    const response = await client.post('/auth/register', userData);
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await client.get('/auth/me');
    return response.data;
  },
};

// Scans API
export const scansAPI = {
  list: async (params = {}) => {
    const response = await client.get('/scans/', { params });
    return response.data;
  },
  
  get: async (id) => {
    const response = await client.get(`/scans/${id}`);
    return response.data;
  },
  
  create: async (scanData) => {
    const response = await client.post('/scans/', scanData);
    return response.data;
  },
  
  cancel: async (id) => {
    const response = await client.post(`/scans/${id}/cancel`);
    return response.data;
  },
};

// Compliance API
export const complianceAPI = {
  getSummary: async (scanId, framework = null) => {
    const params = framework ? { framework } : {};
    const response = await client.get(`/compliance/${scanId}/summary`, { params });
    return response.data;
  },
  
  getMappings: async (scanId, framework = null) => {
    const params = framework ? { framework } : {};
    const response = await client.get(`/compliance/${scanId}/mappings`, { params });
    return response.data;
  },
};

// Reports API
export const reportsAPI = {
  getJSON: async (scanId) => {
    const response = await client.get(`/reports/${scanId}/json`);
    return response.data;
  },
  
  downloadJSON: (scanId) => {
    return `${API_BASE_URL}/reports/${scanId}/json/download`;
  },
  
  downloadPDF: (scanId) => {
    return `${API_BASE_URL}/reports/${scanId}/pdf/download`;
  },
};
