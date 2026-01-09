import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (username, password) =>
    api.post('/auth/login', { username, password }),
  
  logout: () =>
    api.post('/auth/logout'),
  
  register: (username, password, role) =>
    api.post('/auth/register', { username, password, role }),
};

// Media endpoints
export const mediaAPI = {
  list: () => api.get('/media'),
  upload: (formData) => api.post('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/media/${id}`),
};

// Playlist endpoints
export const playlistAPI = {
  list: () => api.get('/playlists'),
  get: (id) => api.get(`/playlists/${id}`),
  create: (data) => api.post('/playlists', data),
  update: (id, data) => api.put(`/playlists/${id}`, data),
  delete: (id) => api.delete(`/playlists/${id}`),
};

// Schedule endpoints
export const scheduleAPI = {
  list: () => api.get('/schedule'),
  create: (data) => api.post('/schedule', data),
  delete: (id) => api.delete(`/schedule/${id}`),
};

// Playout endpoints
export const playoutAPI = {
  status: () => api.get('/playout/status'),
  start: () => api.post('/playout/start'),
  stop: () => api.post('/playout/stop'),
  skip: () => api.post('/playout/skip'),
};

export default api;
