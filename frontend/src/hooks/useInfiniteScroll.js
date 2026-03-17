import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for infinite scrolling / pagination
 * Useful for media library and large lists
 * 
 * @param {Function} fetchFn - Function to fetch data (page, limit) => Promise
 * @param {Object} options - Configuration options
 */
export const useInfiniteScroll = (fetchFn, options = {}) => {
    const {
        initialPage = 1,
        initialLimit = 20,
        threshold = 200, // pixels from bottom to trigger load
        enabled = true,
    } = options;

    const [items, setItems] = useState([]);
    const [page, setPage] = useState(initialPage);
    const [limit] = useState(initialLimit);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState(null);
    const observerRef = useRef(null);
    const loadingRef = useRef(false);

    // Fetch data for a given page
    const fetchPage = useCallback(async (pageNum) => {
        if (loadingRef.current || !hasMore) return;

        loadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            const response = await fetchFn(pageNum, limit);

            if (response.items) {
                setItems(prev => pageNum === 1 ? response.items : [...prev, ...response.items]);
                setHasMore(response.hasMore !== false && response.items.length === limit);
            } else if (Array.isArray(response)) {
                setItems(prev => pageNum === 1 ? response : [...prev, ...response]);
                setHasMore(response.length === limit);
            }

            setPage(pageNum);
        } catch (err) {
            setError(err.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [fetchFn, limit, hasMore]);

    // Initial load
    useEffect(() => {
        if (enabled) {
            fetchPage(initialPage);
        }
    }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

    // Load more function
    const loadMore = useCallback(() => {
        if (!loading && hasMore && !loadingRef.current) {
            fetchPage(page + 1);
        }
    }, [loading, hasMore, page, fetchPage]);

    // Reset and reload
    const reset = useCallback(() => {
        setItems([]);
        setPage(initialPage);
        setHasMore(true);
        setError(null);
        fetchPage(initialPage);
    }, [initialPage, fetchPage]);

    // Set up intersection observer for infinite scroll
    const lastElementRef = useCallback((node) => {
        if (loading) return;

        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        observerRef.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
                loadMore();
            }
        }, {
            rootMargin: `${threshold}px`,
        });

        if (node) {
            observerRef.current.observe(node);
        }
    }, [loading, hasMore, loadMore, threshold]);

    return {
        items,
        loading,
        hasMore,
        error,
        page,
        loadMore,
        reset,
        lastElementRef,
        // For flat lists
        isEmpty: items.length === 0 && !loading,
    };
};

export default useInfiniteScroll;
