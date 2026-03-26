import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
export const APP_VERSION_FALLBACK = 'v2.6.0-ALPHA.54-PRO';


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
    if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
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

  register: (username, password, role, permissions, profile_id) =>
    api.post('/auth/register', { username, password, role, permissions, profile_id }),

  changePassword: (id, password) =>
    api.put(`/auth/users/${id}/password`, { password }),

  listUsers: () => api.get('/auth/users'),

  deleteUser: (id) => api.delete(`/auth/users/${id}`),

  // Profile Endpoints
  listProfiles: () => api.get('/auth/profiles'),
  createProfile: (name, permissions) => api.post('/auth/profiles', { name, permissions }),
  updateProfile: (id, permissions) => api.put(`/auth/profiles/${id}`, { permissions }),
  deleteProfile: (id) => api.delete(`/auth/profiles/${id}`),
};

// Media endpoints
export const mediaAPI = {
  list: (params) => api.get('/media', { params }),
  get: (id) => api.get(`/media/${id}`),
  upload: (formData, onProgress, signal) => api.post('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
    signal: signal
  }),
  delete: (id) => api.delete(`/media/${id}`),
  update: (id, data) => api.put(`/media/${id}`, data),
  setFiller: (id, isFiller) => api.put(`/media/${id}/filler`, { is_filler: isFiller }),
  makeTransparent: (id, color) => api.post(`/media/${id}/transparent`, { color }),
  listFolders: () => api.get('/media/folders'),
  createFolder: (data) => api.post('/media/folders', data),
  deleteFolder: (id) => api.delete(`/media/folders/${id}`),
  moveMedia: (id, folderId) => api.post(`/media/${id}/move`, { folder_id: folderId }),
  copyMedia: (id, targetFolderId) => api.post(`/media/${id}/copy`, { target_folder_id: targetFolderId }),
  checkUsage: (id) => api.get(`/media/${id}/usage`),
  replaceWithFiller: (id) => api.post(`/media/${id}/replace-with-filler`),
  fetchMetadata: (id) => api.post(`/media/${id}/fetch-metadata`),
  optimizeForStreaming: (id) => api.post(`/media/${id}/optimize`),
  generateProxy: (id) => api.post(`/media/${id}/proxy`),
  getProxyStats: () => api.get(`/media/stats/proxy`),
  auditProxies: () => api.get('/media/audit/proxies'),
  batchProxy: (ids) => api.post('/media/batch/proxy', { ids }),
  batchOptimize: (ids) => api.post('/media/batch/optimize', { ids }),
  listProxies: () => api.get(`/media/proxies`),
  deleteSpecificProxies: (ids) => api.post(`/media/proxies/delete`, ids),
  purgeProxies: () => api.delete(`/media/proxies/purge`),
  getMediaTasks: (id) => api.get(`/media/${id}/tasks`),
  getMediaTasksBatch: (ids) => api.post(`/media/tasks/batch`, { ids }),
  mediaHealthCheck: () => api.get(`/media/health-check`),
  sync: () => api.post('/media/sync', {}, { timeout: 120000 }),
};

// Playlist endpoints
export const playlistAPI = {
  list: (channelId, params) => api.get('/playlists', { params: { channel_id: channelId, ...params } }),
  get: (id) => api.get(`/playlists/${id}`),
  create: (data, channelId) => api.post('/playlists', channelId ? { ...data, channel_id: channelId } : data),
  update: (id, data) => api.put(`/playlists/${id}`, data),
  delete: (id) => api.delete(`/playlists/${id}`),
};

// Schedule endpoints
export const scheduleAPI = {
  list: (channelId) => api.get('/schedule/light', { params: channelId ? { channel_id: channelId } : {} }),
  create: (data, channelId) => api.post('/schedule', channelId ? { ...data, channel_id: channelId } : data),
  update: (id, data) => api.put(`/schedule/${id}`, data),
  delete: (id) => api.delete(`/schedule/${id}`),
  deleteBulk: (startDate, endDate) => api.post('/schedule/bulk', { start_date: startDate, end_date: endDate }),
  addException: (scheduleId, date) => api.post('/schedule/exception', { schedule_id: scheduleId, date }),
};

// Playout endpoints (default / legacy — used by Dashboard)
export const playoutAPI = {
  status: () => api.get('/playout/status'),
  start: () => api.post('/playout/start'),
  stop: () => api.post('/playout/stop'),
  skip: () => api.post('/playout/skip'),
  skipClip: () => api.post('/playout/skip'), // alias for Dashboard compatibility
  pause: () => api.post('/playout/pause'),
  resume: () => api.post('/playout/resume'),
  diagnose: () => api.get('/playout/diagnose'),
  openMonitor: () => api.post('/playout/open-monitor'),
  getLogs: () => api.get('/playout/logs'),
  toggleProtocol: (protocol, enabled) => api.post('/playout/protocol/toggle', { protocol, enabled }),
};

// Per-channel playout endpoints — used by MultiChannelPanel
export const channelPlayoutAPI = {
  status: (channelId) => api.get(`/v2/channels/${channelId}/playout/status`),
  start: (channelId) => api.post(`/v2/channels/${channelId}/playout/start`),
  stop: (channelId) => api.post(`/v2/channels/${channelId}/playout/stop`),
  skip: (channelId) => api.post(`/v2/channels/${channelId}/playout/skip`),
};

// Per-channel watchfolder endpoints — Phase 6
export const channelWatchfolderAPI = {
  status: (channelId) => api.get(`/v2/channels/${channelId}/watchfolder/status`),
  sync: (channelId) => api.post(`/v2/channels/${channelId}/watchfolder/sync`),
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
  uploadOverlayPair: (formData) => api.post('/settings/upload-overlay-pair', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  testApi: (service, apiKey) => api.post('/settings/test-api', { service, api_key: apiKey }),
  applyDefaults: () => api.post('/settings/apply-defaults'),
  resetAll: () => api.post('/settings/reset-all'),
  getSystemLogs: () => api.get('/settings/system-logs'),
  getVMLogs: () => api.get('/settings/vm-logs'),
  getDiagnostics: () => api.get('/settings/diagnostics'),
};

// Template endpoints
export const templateAPI = {
  list: (channelId) => api.get('/templates', { params: channelId ? { channel_id: channelId } : {} }),
  create: (data, channelId) => api.post('/templates', channelId ? { ...data, channel_id: channelId } : data),
  update: (id, data) => api.put(`/templates/${id}`, data),
  delete: (id) => api.delete(`/templates/${id}`),
};

// Protected Assets endpoints
export const protectedAPI = {
  list: () => api.get('/protected'),
  getStreamUrl: (filename) => `${API_BASE_URL}/protected/${filename}`,
};

// Live Inputs endpoints (Phase 30)
export const liveInputsAPI = {
  list: (channelId, params) => api.get('/inputs', { params: { channel_id: channelId, ...params } }),
  get: (id) => api.get(`/inputs/${id}`),
  create: (data, channelId) => api.post('/inputs', channelId ? { ...data, channel_id: channelId } : data),
  update: (id, data) => api.put(`/inputs/${id}`, data),
  delete: (id) => api.delete(`/inputs/${id}`),
  getStatus: (id) => api.get(`/inputs/${id}/status`),
  route: (id, data) => api.post(`/inputs/${id}/route`, data),
  getRoutes: (id) => api.get(`/inputs/${id}/routes`),
};

// Social Streaming endpoints (Phase 30)
export const socialStreamsAPI = {
  list: (channelId) => api.get('/streams', { params: channelId ? { channel_id: channelId } : {} }),
  get: (id) => api.get(`/streams/${id}`),
  create: (data, channelId) => api.post('/streams', channelId ? { ...data, channel_id: channelId } : data),
  update: (id, data) => api.put(`/streams/${id}`, data),
  delete: (id) => api.delete(`/streams/${id}`),
  start: (id) => api.post(`/streams/${id}/start`),
  stop: (id) => api.post(`/streams/${id}/stop`),
  getStatus: (id) => api.get(`/streams/${id}/status`),
};

// Channels endpoints (v2)
export const channelsAPI = {
  list: () => api.get('/v2/channels'),
  get: (id) => api.get(`/v2/channels/${id}`),
  create: (data) => api.post('/v2/channels', data),
  update: (id, data) => api.put(`/v2/channels/${id}`, data),
  delete: (id) => api.delete(`/v2/channels/${id}`),
};

// Analytics endpoints (v2)
export const analyticsAPI = {
  getAsRun: (params) => api.get('/v2/analytics/as-run', { params }),
};

// Per-channel settings overrides
export const channelSettingsAPI = {
  get: (channelId) => api.get(`/v2/channels/${channelId}/settings`),
  put: (channelId, data) => api.put(`/v2/channels/${channelId}/settings`, data),
};

// User-channel access control
export const userChannelAPI = {
  getChannels: (userId) => api.get(`/v2/channels/users/${userId}/channels`),
  setChannels: (userId, channelIds) =>
    api.put(`/v2/channels/users/${userId}/channels`, { channel_ids: channelIds }),
};

export default api;
