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
  upload: (formData, onProgress) => api.post('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
  }),
  delete: (id) => api.delete(`/media/${id}`),
  setFiller: (id, isFiller) => api.put(`/media/${id}/filler`, { is_filler: isFiller }),
  makeTransparent: (id, color) => api.post(`/media/${id}/transparent`, { color }),
  listFolders: () => api.get('/media/folders'),
  createFolder: (data) => api.post('/media/folders', data),
  deleteFolder: (id) => api.delete(`/media/folders/${id}`),
  moveMedia: (id, folderId) => api.post(`/media/${id}/move`, { folder_id: folderId }),
  copyMedia: (id, targetFolderId) => api.post(`/media/${id}/copy`, { target_folder_id: targetFolderId }),
  checkUsage: (id) => api.get(`/media/${id}/usage`),
  replaceWithFiller: (id) => api.post(`/media/${id}/replace-with-filler`),
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
  deleteBulk: (startDate, endDate) => api.post('/schedule/bulk', { start_date: startDate, end_date: endDate }),
};

// Playout endpoints
export const playoutAPI = {
  status: () => api.get('/playout/status'),
  start: () => api.post('/playout/start'),
  stop: () => api.post('/playout/stop'),
  skip: () => api.post('/playout/skip'),
  diagnose: () => api.get('/playout/diagnose'),
  openMonitor: () => api.post('/playout/open-monitor'),
};

// Settings endpoints
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  uploadLogo: (formData) => api.post('/settings/upload-logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  uploadAppLogo: (formData) => api.post('/settings/upload-app-logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  resetAll: () => api.post('/settings/reset-all'),
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
