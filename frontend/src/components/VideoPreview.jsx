import { useEffect, useRef } from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

export default function VideoPreview({ src, type = 'application/x-mpegURL' }) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    if (!playerRef.current && videoRef.current) {
      const videoElement = videoRef.current;

      playerRef.current = videojs(videoElement, {
        controls: true,
        autoplay: false,
        preload: 'auto',
        fluid: true,
        aspectRatio: '16:9',
        liveui: true,
        sources: src ? [{
          src: src,
          type: type
        }] : []
      });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (playerRef.current && src) {
      playerRef.current.src({
        src: src,
        type: type
      });
    }
  }, [src, type]);

  return (
    <Box>
      <div data-vjs-player>
        <video
          ref={videoRef}
          className="video-js vjs-big-play-centered"
        />
      </div>
    </Box>
  );
}
