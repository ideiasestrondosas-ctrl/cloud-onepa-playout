import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { playoutAPI } from '../services/api';

/**
 * Custom hook for keyboard shortcuts
 * Provides quick actions for operators
 * 
 * Shortcuts:
 * - Space: Toggle playout (start/stop)
 * - Ctrl+S: Save current settings
 * - Ctrl+N: New playlist
 * - Ctrl+F: Focus search
 * - Ctrl+,: Open settings
 * - Ctrl+M: Toggle mute
 * - Ctrl+H: Go to home/dashboard
 * - Ctrl+L: Go to live inputs
 * - Escape: Close modal/dialog
 */
export const useKeyboardShortcuts = (options = {}) => {
    const navigate = useNavigate();
    const {
        isPlaying,
        togglePlay = null
    } = options;

    // Handle playout toggle (Space key)
    const handlePlayoutToggle = useCallback(async () => {
        if (togglePlay) {
            togglePlay();
        } else {
            try {
                if (isPlaying) {
                    await playoutAPI.stop();
                } else {
                    await playoutAPI.start();
                }
            } catch (error) {
                console.error('Failed to toggle playout:', error);
            }
        }
    }, [togglePlay, isPlaying]);

    // Handle save action
    const handleSave = useCallback(() => {
        // Trigger save in current component
        window.dispatchEvent(new CustomEvent('keyboard-save'));
    }, []);

    // Handle new playlist
    const handleNewPlaylist = useCallback(() => {
        navigate('/playlists?action=new');
    }, [navigate]);

    // Handle search focus
    const handleSearch = useCallback(() => {
        const searchInput = document.querySelector('[data-shortcut="search"]');
        if (searchInput) {
            searchInput.focus();
        }
    }, []);

    // Handle settings
    const handleSettings = useCallback(() => {
        navigate('/settings');
    }, [navigate]);

    // Handle mute toggle
    const handleMute = useCallback(() => {
        window.dispatchEvent(new CustomEvent('keyboard-mute'));
    }, []);

    // Handle go home
    const handleHome = useCallback(() => {
        navigate('/');
    }, [navigate]);

    // Handle live inputs
    const handleLiveInputs = useCallback(() => {
        navigate('/live-inputs');
    }, [navigate]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            // Ignore if user is typing in an input/textarea
            const target = event.target;
            const isInput = target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.tagName === 'SELECT' ||
                target.isContentEditable;

            // Escape always closes modals regardless of focus
            if (event.key === 'Escape') {
                window.dispatchEvent(new CustomEvent('keyboard-escape'));
                return;
            }

            // Don't trigger shortcuts when typing in inputs (except for specific combos)
            if (isInput) {
                // Allow Ctrl+F in inputs for browser find
                if (event.ctrlKey && event.key === 'f') {
                    event.preventDefault();
                    handleSearch();
                }
                return;
            }

            // Space - Toggle playout
            if (event.key === ' ' && !event.ctrlKey && !event.metaKey) {
                event.preventDefault();
                handlePlayoutToggle();
            }

            // Ctrl+S - Save
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault();
                handleSave();
            }

            // Ctrl+N - New playlist
            if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
                event.preventDefault();
                handleNewPlaylist();
            }

            // Ctrl+F - Search
            if ((event.ctrlKey || event.metaKey) && event.key === 'f' && !isInput) {
                event.preventDefault();
                handleSearch();
            }

            // Ctrl+, - Settings
            if ((event.ctrlKey || event.metaKey) && event.key === ',') {
                event.preventDefault();
                handleSettings();
            }

            // Ctrl+M - Mute
            if ((event.ctrlKey || event.metaKey) && event.key === 'm') {
                event.preventDefault();
                handleMute();
            }

            // Ctrl+H - Home
            if ((event.ctrlKey || event.metaKey) && event.key === 'h') {
                event.preventDefault();
                handleHome();
            }

            // Ctrl+L - Live inputs
            if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
                event.preventDefault();
                handleLiveInputs();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [
        handlePlayoutToggle,
        handleSave,
        handleNewPlaylist,
        handleSearch,
        handleSettings,
        handleMute,
        handleHome,
        handleLiveInputs
    ]);

    return {
        handlePlayoutToggle,
        handleSave,
        handleNewPlaylist,
        handleSearch,
        handleSettings,
        handleMute,
    };
};

export default useKeyboardShortcuts;
