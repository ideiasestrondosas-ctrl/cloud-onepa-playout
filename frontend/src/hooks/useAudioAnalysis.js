import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for audio analysis using Web Audio API
 * Provides real-time audio level measurement for LUFS meter display
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether audio analysis is enabled
 * @param {boolean} options.muted - Whether audio is muted (affects analysis)
 * @param {number} options.fftSize - FFT size for analyzer (default: 256)
 * @param {number} options.updateInterval - Update interval in ms (default: 50)
 * @param {boolean} options.safariSimulation - Enable Safari fallback simulation
 * @returns {Object} Audio analysis state and controls
 */
export function useAudioAnalysis({
    enabled = true,
    muted = false,
    fftSize = 256,
    updateInterval = 50,
    safariSimulation = true
} = {}) {
    const [audioLevel, setAudioLevel] = useState(0);
    const [isContextSuspended, setIsContextSuspended] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    const audioCtxRef = useRef(null);
    const analyzerRef = useRef(null);
    const sourceNodeRef = useRef(null);
    const animationRef = useRef(null);
    const mediaElementRef = useRef(null);

    // Detect Safari for native HLS handling
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    /**
     * Initialize audio context and analyzer
     * Must be called from a user gesture for Safari compatibility
     */
    const initializeAudio = useCallback(async (mediaElement) => {
        if (!mediaElement || !(mediaElement instanceof HTMLMediaElement)) {
            console.warn('[useAudioAnalysis] Invalid media element provided');
            return false;
        }

        mediaElementRef.current = mediaElement;

        try {
            // Ensure crossOrigin is set for AudioContext
            mediaElement.crossOrigin = "anonymous";

            if (!audioCtxRef.current) {
                // Safari requires webkitAudioContext
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                audioCtxRef.current = new AudioCtx();
                analyzerRef.current = audioCtxRef.current.createAnalyser();
                analyzerRef.current.fftSize = fftSize;
                console.log('[useAudioAnalysis] AudioContext & Analyzer created');
            }

            // Resume context if suspended (required by browsers)
            if (audioCtxRef.current.state === 'suspended') {
                try {
                    await audioCtxRef.current.resume();
                    console.log('[useAudioAnalysis] AudioContext resumed');
                    setIsContextSuspended(false);
                } catch (err) {
                    console.warn('[useAudioAnalysis] Resume failed:', err);
                    setIsContextSuspended(true);
                    return false;
                }
            }

            // Connect source if not already connected
            if (audioCtxRef.current.state === 'running' && !mediaElement.__audioSourceConnected) {
                try {
                    sourceNodeRef.current = audioCtxRef.current.createMediaElementSource(mediaElement);
                    sourceNodeRef.current.connect(analyzerRef.current);
                    analyzerRef.current.connect(audioCtxRef.current.destination);
                    mediaElement.__audioSourceConnected = true;
                    console.log('[useAudioAnalysis] Source connected to analyzer');
                    setIsInitialized(true);
                } catch (e) {
                    console.warn('[useAudioAnalysis] Connection failed (already connected?):', e);
                    mediaElement.__audioSourceConnected = true;
                    setIsInitialized(true);
                }
            }

            return true;
        } catch (e) {
            console.error('[useAudioAnalysis] Initialization failed:', e);
            return false;
        }
    }, [fftSize]);

    /**
     * Start the audio level update loop
     */
    const startAnalysis = useCallback(() => {
        if (!analyzerRef.current) {
            console.warn('[useAudioAnalysis] Analyzer not initialized');
            return;
        }

        const bufferLength = analyzerRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateLevel = () => {
            if (!analyzerRef.current) return;

            analyzerRef.current.getByteFrequencyData(dataArray);

            // Calculate RMS (Root Mean Square) for accurate level measurement
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i] * dataArray[i];
            }
            const rms = Math.sqrt(sum / bufferLength);
            let level = Math.min(100, (rms / 128) * 100);

            // Safari Fallback: Simulate meter if context is blocked
            if (safariSimulation && isSafari && level === 0 && !mediaElementRef.current?.paused) {
                const time = Date.now() / 1000;
                // Smooth sine-wave based simulation (breathing effect + mild jitter)
                level = 30 + Math.sin(time * 3) * 15 + Math.cos(time * 7) * 10 + Math.random() * 5;
            }

            setAudioLevel(level);

            // Throttle to ~20fps for smooth CSS transitions
            animationRef.current = setTimeout(updateLevel, updateInterval);
        };

        updateLevel();
    }, [updateInterval, safariSimulation, isSafari]);

    /**
     * Stop the audio level update loop
     */
    const stopAnalysis = useCallback(() => {
        if (animationRef.current) {
            clearTimeout(animationRef.current);
            animationRef.current = null;
        }
        setAudioLevel(0);
    }, []);

    /**
     * Resume suspended audio context (for Safari)
     */
    const resumeContext = useCallback(async () => {
        if (audioCtxRef.current?.state === 'suspended') {
            try {
                await audioCtxRef.current.resume();
                setIsContextSuspended(false);
                console.log('[useAudioAnalysis] Context resumed manually');
                return true;
            } catch (err) {
                console.warn('[useAudioAnalysis] Manual resume failed:', err);
                return false;
            }
        }
        return true;
    }, []);

    // Setup click/touch listeners for Safari audio context initialization
    useEffect(() => {
        if (!enabled || !mediaElementRef.current) return;

        const handleUserInteraction = async () => {
            if (mediaElementRef.current) {
                await initializeAudio(mediaElementRef.current);
            }
        };

        document.addEventListener('click', handleUserInteraction, { once: true });
        document.addEventListener('touchstart', handleUserInteraction, { once: true });

        // Try immediate initialization if context is already running
        if (audioCtxRef.current?.state === 'running') {
            handleUserInteraction();
        }

        return () => {
            document.removeEventListener('click', handleUserInteraction);
            document.removeEventListener('touchstart', handleUserInteraction);
        };
    }, [enabled, initializeAudio]);

    // Start/stop analysis based on enabled and muted state
    useEffect(() => {
        if (enabled && !muted && isInitialized) {
            startAnalysis();
        } else {
            stopAnalysis();
        }

        return () => {
            stopAnalysis();
        };
    }, [enabled, muted, isInitialized, startAnalysis, stopAnalysis]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (animationRef.current) {
                clearTimeout(animationRef.current);
            }
            if (audioCtxRef.current) {
                audioCtxRef.current.close().catch(e =>
                    console.warn('[useAudioAnalysis] AudioContext close failed:', e)
                );
            }
        };
    }, []);

    // Reset source reference when needed (for player reloads)
    const resetSource = useCallback(() => {
        sourceNodeRef.current = null;
        setIsInitialized(false);
    }, []);

    return {
        audioLevel,
        isContextSuspended,
        isInitialized,
        initializeAudio,
        resumeContext,
        resetSource,
        startAnalysis,
        stopAnalysis
    };
}

export default useAudioAnalysis;