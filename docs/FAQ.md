# Cloud Onepa Playout - FAQ

## Frequently Asked Questions

### Installation and Configuration

**Q: What is the difference between Docker and manual installation?**  
A: Docker is simpler and isolated. Manual offers more control but requires dependency configuration.

**Q: Can I use SQLite instead of PostgreSQL?**  
A: Currently only PostgreSQL is supported. SQLite may be added in the future.

**Q: Do I need a GPU to use Cloud Onepa Playout?**  
A: No. FFmpeg uses only CPU by default. GPU can accelerate encoding but is not required.

---

### General Use

**Q: How do I upload videos?**  
A: Go to Media Library → Upload → Drag files or click to select.

**Q: Which video formats are supported?**  
A: All formats supported by FFmpeg (MP4, MKV, AVI, MOV, WebM, etc).

**Q: How do I create a 24h playlist?**  
A: Playlist Editor → Add clips → System calculates duration → Auto-fill with fillers if necessary.

**Q: Can I schedule different playlists for each day?**  
A: Yes! Use the Calendar to assign playlists to specific dates.

---

### Playout and Streaming

**Q: How do I start the broadcast?**  
A: Dashboard → "Start Playout" button → Select playlist → Confirm.

**Q: Can I stream to multiple destinations?**  
A: Currently supports one output. Multi-output will be added in future versions.

**Q: Which streaming protocols are supported?**  
A: RTMP, HLS, SRT, UDP. Configurable in Settings.

**Q: How can I see a preview of what is broadcasting?**  
A: The Dashboard has a real-time preview of the stream.

---

### Troubleshooting

**Q: Video plays but no sound**  
A: Check if the video has an audio track. The system adds silence automatically if configured.

**Q: Playlist does not complete 24h**  
A: Configure fillers in Settings → Playout → Filler Content. The system fills automatically.

**Q: Stream is buffering**  
A: Reduce the bitrate in Settings → Output → Bitrate. Recommended: 5000k for 1080p.

**Q: Error "FFmpeg not found"**  
A: Install FFmpeg: `brew install ffmpeg` (macOS) or `apt install ffmpeg` (Linux).

---

### Advanced Features

**Q: Can I add logos to the videos?**  
A: Yes! Settings → Overlay → Upload logo → Configure position.

**Q: How do I normalize audio from different clips?**  
A: Settings → Audio → Enable EBU R128 Loudness Normalization.

**Q: Can I use remote sources (URLs)?**  
A: Yes. Media Library → Add Remote Source → Paste URL (HTTP/RTMP/etc).

---

### Performance

**Q: How many resources do I need for 1080p?**  
A: Minimum: 4 CPU cores, 4GB RAM. Recommended: 8 cores, 8GB RAM.

**Q: Can I run it on a Raspberry Pi?**  
A: Possible but not recommended for resolutions > 720p. Use Pi 4 with 8GB RAM.

---

### Development

**Q: How can I contribute to the project?**  
A: Fork → Branch → Commits → Pull Request. See CONTRIBUTING.md.

**Q: Can I use it commercially?**  
A: Yes, under GPL v3 license. Modifications must be open-source.

---

## Didn't find an answer?

Open a [GitHub issue](https://github.com/onepa/cloud-onepa-playout/issues) or consult the [full documentation](https://docs.onepa.cloud).
