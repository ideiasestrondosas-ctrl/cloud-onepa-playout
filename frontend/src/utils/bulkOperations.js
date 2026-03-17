import { mediaAPI } from '../services/api';
import { useState, useCallback } from 'react';

/**
 * Bulk operations utility for media library
 * Supports batch delete, move, tag, proxy generation, and optimization
 */

export class BulkOperations {
    constructor(options = {}) {
        this.onProgress = options.onProgress || (() => { });
        this.onError = options.onError || console.error;
        this.concurrentLimit = options.concurrentLimit || 3;
    }

    /**
     * Delete multiple media items
     * @param {string[]} ids - Array of media IDs
     */
    async deleteMedia(ids) {
        const results = { success: [], failed: [] };
        const total = ids.length;

        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            try {
                await mediaAPI.delete(id);
                results.success.push(id);
            } catch (error) {
                results.failed.push({ id, error: error.message });
            }
            this.onProgress(Math.round(((i + 1) / total) * 100));
        }

        return results;
    }

    /**
     * Move multiple media items to a folder
     * @param {string[]} ids - Array of media IDs
     * @param {string} folderId - Target folder ID
     */
    async moveToFolder(ids, folderId) {
        const results = { success: [], failed: [] };
        const total = ids.length;

        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            try {
                await mediaAPI.moveMedia(id, folderId);
                results.success.push(id);
            } catch (error) {
                results.failed.push({ id, error: error.message });
            }
            this.onProgress(Math.round(((i + 1) / total) * 100));
        }

        return results;
    }

    /**
     * Set filler status for multiple media items
     * @param {string[]} ids - Array of media IDs
     * @param {boolean} isFiller - Filler status
     */
    async setFiller(ids, isFiller) {
        const results = { success: [], failed: [] };
        const total = ids.length;

        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            try {
                await mediaAPI.setFiller(id, isFiller);
                results.success.push(id);
            } catch (error) {
                results.failed.push({ id, error: error.message });
            }
            this.onProgress(Math.round(((i + 1) / total) * 100));
        }

        return results;
    }

    /**
     * Generate proxies for multiple media items
     * @param {string[]} ids - Array of media IDs
     */
    async generateProxies(ids) {
        const results = { success: [], failed: [] };
        const total = ids.length;

        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            try {
                await mediaAPI.generateProxy(id);
                results.success.push(id);
            } catch (error) {
                results.failed.push({ id, error: error.message });
            }
            this.onProgress(Math.round(((i + 1) / total) * 100));
        }

        return results;
    }

    /**
     * Optimize multiple media items for streaming
     * @param {string[]} ids - Array of media IDs
     */
    async optimizeForStreaming(ids) {
        const results = { success: [], failed: [] };
        const total = ids.length;

        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            try {
                await mediaAPI.optimizeForStreaming(id);
                results.success.push(id);
            } catch (error) {
                results.failed.push({ id, error: error.message });
            }
            this.onProgress(Math.round(((i + 1) / total) * 100));
        }

        return results;
    }

    /**
     * Replace multiple media items with filler
     * @param {string[]} ids - Array of media IDs
     */
    async replaceWithFiller(ids) {
        const results = { success: [], failed: [] };
        const total = ids.length;

        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            try {
                await mediaAPI.replaceWithFiller(id);
                results.success.push(id);
            } catch (error) {
                results.failed.push({ id, error: error.message });
            }
            this.onProgress(Math.round(((i + 1) / total) * 100));
        }

        return results;
    }
}

/**
 * Hook for bulk selection in data tables
 */
export const useBulkSelection = () => {
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [selectAll, setSelectAll] = useState(false);

    const toggleSelection = useCallback((id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const toggleSelectAll = useCallback((ids) => {
        if (selectAll) {
            setSelectedIds(new Set());
            setSelectAll(false);
        } else {
            setSelectedIds(new Set(ids));
            setSelectAll(true);
        }
    }, [selectAll]);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
        setSelectAll(false);
    }, []);

    const isSelected = useCallback((id) => {
        return selectedIds.has(id);
    }, [selectedIds]);

    return {
        selectedIds: Array.from(selectedIds),
        selectedCount: selectedIds.size,
        selectAll,
        toggleSelection,
        toggleSelectAll,
        clearSelection,
        isSelected,
    };
};

export default BulkOperations;
