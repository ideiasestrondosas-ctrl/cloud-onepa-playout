import axios from 'axios';

const API_BASE = '/api/graphics-layers';

export const graphicsLayersAPI = {
    // List all graphics layers
    list: () => axios.get(API_BASE),

    // Create a new graphics layer
    create: (data) => axios.post(API_BASE, data),

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
