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

  changePassword: (id, password) =>
    api.put(`/auth/users/${id}/password`, { password }),

  listUsers: () => api.get('/auth/users'),
  
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
};

// Media endpoints
export const mediaAPI = {
  list: (params) => api.get('/media', { params }),
  upload: (formData) => api.post('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/media/${id}`),
  setFiller: (id, isFiller) => api.put(`/media/${id}/filler`, { is_filler: isFiller }),
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
  update: (id, data) => api.put(`/schedule/${id}`, data),
  delete: (id) => api.delete(`/schedule/${id}`),
};

// Playout endpoints
export const playoutAPI = {
  status: () => api.get('/playout/status'),
  start: () => api.post('/playout/start'),
  stop: () => api.post('/playout/stop'),
  skip: () => api.post('/playout/skip'),
  diagnose: () => api.get('/playout/debug'),
};

// Settings endpoints
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  uploadLogo: (formData) => api.post('/settings/upload-logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// Template endpoints
export const templateAPI = {
  list: () => api.get('/templates'),
  create: (data) => api.post('/templates', data),
  update: (id, data) => api.put(`/templates/${id}`, data),
  delete: (id) => api.delete(`/templates/${id}`),
};

// Protected Assets endpoints
export const protectedAPI = {
  list: () => api.get('/protected'),
  getStreamUrl: (filename) => `${API_BASE_URL}/protected/${filename}`,
};

export default api;
