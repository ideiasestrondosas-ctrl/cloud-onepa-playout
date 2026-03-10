/**
 * service-graphics — HTML5 Graphics Compositor
 *
 * Phase 3 / v2.4.0-ALPHA.42-PRO
 *
 * Responsibilities:
 *   - POST /render  — Accept template JSON + data, render via headless Chromium,
 *                     return PNG image buffer (for FFmpeg overlay pipe)
 *   - POST /preview — Same as /render but returns base64 PNG for UI preview
 *   - GET  /health  — Health check
 *
 * The render pipeline:
 *   1. Build an HTML page from the template `structure.elements` array
 *   2. Launch Puppeteer, navigate to the in-memory page (data: URI)
 *   3. Take a full-page screenshot at 1920×1080
 *   4. Return raw PNG bytes to caller
 *
 * FFmpeg overlay usage (caller side):
 *   ffmpeg -i clean_stream.m3u8 \
 *          -i http://graphics:3002/render \
 *          -filter_complex overlay=0:0 \
 *          output.m3u8
 */

'use strict';

const express    = require('express');
const puppeteer  = require('puppeteer');

const PORT = process.env.PORT || 3002;

// ── Puppeteer browser singleton ───────────────────────────────────────────────
let browser = null;

async function getBrowser() {
  if (!browser || !browser.connected) {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1920,1080',
      ],
    });
  }
  return browser;
}

// ── Template → HTML converter ─────────────────────────────────────────────────
/**
 * Convert a template `structure.elements` array into a self-contained HTML
 * page at 1920×1080 with a transparent background. Each element is rendered
 * as an absolutely-positioned div matching its position, size, and type.
 */
function buildHtml(elements = [], data = {}) {
  const elHtml = elements.map((el) => {
    const baseStyle = [
      `position:absolute`,
      `left:${el.x ?? 0}%`,
      `top:${el.y ?? 0}%`,
      `width:${el.width ?? 200}px`,
      `height:${el.height ?? 50}px`,
      `opacity:${el.opacity ?? 1}`,
      `overflow:hidden`,
    ].join(';');

    switch (el.type) {
      case 'text':
        return `<div style="${baseStyle};color:${el.color||'#fff'};font-size:${el.fontSize||32}px;font-family:sans-serif;display:flex;align-items:center;">${data[el.id] || el.content || ''}</div>`;

      case 'clock':
        // Clock value is injected at render time via `data` map
        return `<div style="${baseStyle};color:${el.color||'#00e5ff'};font-size:${el.fontSize||28}px;font-family:monospace;display:flex;align-items:center;">${data.clock || new Date().toLocaleTimeString()}</div>`;

      case 'lower_third':
        return `<div style="${baseStyle};background:${el.bgColor||'rgba(0,0,0,0.7)'};padding:8px 16px;box-sizing:border-box;">
          <div style="color:${el.color||'#00e5ff'};font-size:20px;font-weight:800;font-family:sans-serif;">${data[el.id]?.title || el.title || ''}</div>
          <div style="color:#fff;font-size:14px;font-family:sans-serif;">${data[el.id]?.subtitle || el.subtitle || ''}</div>
        </div>`;

      case 'marquee': {
        const text = data[el.id] || el.content || '';
        return `<div style="${baseStyle};background:${el.bgColor||'rgba(0,0,0,0.8)'};display:flex;align-items:center;overflow:hidden;">
          <div style="color:${el.color||'#fff'};font-size:16px;font-family:sans-serif;white-space:nowrap;animation:marquee ${el.speed||80}s linear infinite;">${text}</div>
        </div>`;
      }

      case 'shape':
        return `<div style="${baseStyle};background:${el.fill||'#00e5ff'};border-radius:4px;"></div>`;

      case 'image':
        return `<img src="${data[el.id] || el.src || ''}" style="${baseStyle};object-fit:contain;" onerror="this.style.display='none'" />`;

      default:
        return '';
    }
  }).join('\n');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    width: 1920px; height: 1080px;
    background: transparent;
    overflow: hidden;
    position: relative;
  }
  @keyframes marquee {
    from { transform: translateX(1920px); }
    to   { transform: translateX(-100%); }
  }
</style>
</head>
<body>
${elHtml}
</body>
</html>`;
}

// ── Render helper ─────────────────────────────────────────────────────────────
async function renderTemplate(elements, data = {}) {
  const b    = await getBrowser();
  const page = await b.newPage();
  try {
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setContent(buildHtml(elements, data), { waitUntil: 'networkidle0', timeout: 10_000 });
    const png = await page.screenshot({
      type: 'png',
      fullPage: false,
      omitBackground: true,          // transparent background (for FFmpeg overlay)
      clip: { x: 0, y: 0, width: 1920, height: 1080 },
    });
    return png;
  } finally {
    await page.close();
  }
}

// ── Express app ───────────────────────────────────────────────────────────────
const app = express();
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) =>
  res.json({ status: 'ok', service: 'graphics', version: '2.4.0-ALPHA.42-PRO' })
);

/**
 * POST /render
 * Body: { structure: { elements: [...] }, data: { [elementId]: value } }
 * Returns: PNG image bytes (Content-Type: image/png)
 */
app.post('/render', async (req, res) => {
  try {
    const { structure = {}, data = {} } = req.body;
    const png = await renderTemplate(structure.elements || [], data);
    res.set('Content-Type', 'image/png');
    res.set('Content-Length', png.byteLength);
    res.send(png);
  } catch (err) {
    console.error('[graphics] render error', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /preview
 * Same as /render but returns base64-encoded PNG for UI preview.
 * Body: { structure: { elements: [...] }, data: {} }
 * Returns: { image: "data:image/png;base64,..." }
 */
app.post('/preview', async (req, res) => {
  try {
    const { structure = {}, data = {} } = req.body;
    const png = await renderTemplate(structure.elements || [], data);
    res.json({ image: `data:image/png;base64,${Buffer.from(png).toString('base64')}` });
  } catch (err) {
    console.error('[graphics] preview error', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.info(`[graphics] compositor listening on :${PORT}`);
  // Pre-warm browser
  getBrowser()
    .then(() => console.info('[graphics] Chromium ready'))
    .catch((err) => console.error('[graphics] Chromium launch failed', err.message));
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
process.on('SIGTERM', async () => {
  console.info('[graphics] SIGTERM — shutting down');
  if (browser) await browser.close();
  process.exit(0);
});
