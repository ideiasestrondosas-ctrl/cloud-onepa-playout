const cp = require('child_process');
const { exec } = require('child_process');

/**
 * VLC Smart Launcher for Cloud Onepa Playout
 * Run this on your host machine (Mac) to watch the stream.
 * Usage: node scripts/watch_stream.js
 */

const STREAM_URL = 'http://localhost:3000/hls/stream.m3u8';

function findVLC() {
    return new Promise((resolve, reject) => {
        // Platform specific VLC paths
        if (process.platform === 'darwin') {
            resolve('/Applications/VLC.app/Contents/MacOS/VLC');
        } else if (process.platform === 'win32') {
            resolve('C:\\Program Files\\VideoLAN\\VLC\\vlc.exe');
        } else {
            // Linux or other: try 'vlc' command
            exec('which vlc', (err, stdout) => {
                if (err) reject('VLC not found in PATH');
                else resolve(stdout.trim());
            });
        }
    });
}

async function launch() {
    try {
        const vlcPath = await findVLC();
        console.log(`🚀 Launching VLC from: ${vlcPath}`);
        console.log(`📺 Stream URL: ${STREAM_URL}`);
        
        const vlc = cp.spawn(vlcPath, [STREAM_URL, '--network-caching=1000'], {
            detached: true,
            stdio: 'ignore'
        });

        vlc.unref();
        console.log('✅ VLC started. You can close this terminal.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

launch();
