import axios from 'axios';

const API_BASE = '/api/graphics-layers';

export const graphicsLayersAPI = {
    // List all graphics layers scoped to a channel
    list: (channelId) => axios.get(API_BASE, { params: channelId ? { channel_id: channelId } : {} }),

    // Create a new graphics layer (optionally scoped to a channel)
    create: (data, channelId) => axios.post(API_BASE, channelId ? { ...data, channel_id: channelId } : data),

    // Update an existing graphics layer
    update: (id, data) => axios.put(`${API_BASE}/${id}`, data),

    // Delete a graphics layer
    delete: (id) => axios.delete(`${API_BASE}/${id}`),

    // Toggle layer enabled state
    toggle: (id) => axios.put(`${API_BASE}/${id}/toggle`),

    // Update layer position
    updatePosition: (id, data) => axios.put(`${API_BASE}/${id}/position`, data),

    // Reorder layers
    reorder: (layerIds) => axios.put(`${API_BASE}/reorder`, { layer_ids: layerIds }),
};

export default graphicsLayersAPI;
