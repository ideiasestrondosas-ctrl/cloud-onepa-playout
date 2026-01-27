# PDF Generation Instructions

## Method 1: Using Python Script (Recommended)

### Prerequisites

Install required Python packages:

```bash
pip3 install markdown weasyprint
```

### Generate PDF

```bash
cd "/Users/arnaldoesilva/Documents/Cloud Onepa Playout"
python3 scripts/generate_pdf.py
```

The PDF will be created at: `docs/USER_MANUAL.pdf`

---

## Method 2: Using Browser (Simple, No Installation)

### Steps:

1. **Install a Markdown Viewer Extension** (one-time setup)
   - **Chrome/Edge:** [Markdown Viewer](https://chrome.google.com/webstore/detail/markdown-viewer)
   - **Firefox:** [Markdown Viewer Webext](https://addons.mozilla.org/firefox/addon/markdown-viewer-webext/)

2. **Open the Manual**
   - Navigate to: `file:///Users/arnaldoesilva/Documents/Cloud%20Onepa%20Playout/docs/USER_MANUAL.md`
   - Or drag `USER_MANUAL.md` into your browser

3. **Print to PDF**
   - Press `Cmd+P` (Mac) or `Ctrl+P` (Windows/Linux)
   - Select "Save as PDF" as the printer
   - Adjust settings:
     - **Layout:** Portrait
     - **Margins:** Default
     - **Background graphics:** Enabled (to include images)
   - Click "Save"
   - Save as: `USER_MANUAL.pdf`

---

## Method 3: Using Visual Studio Code

If you have VS Code installed:

1. Open `USER_MANUAL.md` in VS Code
2. Install extension: "Markdown PDF" by yzane
3. Right-click in the editor
4. Select "Markdown PDF: Export (pdf)"
5. PDF will be created in the same directory

---

## Method 4: Using Online Converter

1. Go to: https://www.markdowntopdf.com/
2. Upload `USER_MANUAL.md`
3. Click "Convert"
4. Download the generated PDF

---

## Troubleshooting

### Images not showing in PDF

- Ensure all image paths are absolute (starting with `file:///`)
- Check that screenshots exist in `docs/screenshots/` folder

### PDF too large

- Compress images before generating PDF
- Use lower quality settings in browser print dialog

### Formatting issues

- Use Method 1 (Python script) for best results
- Ensure markdown syntax is correct

---

## Recommended Settings

For professional-looking PDF:

- **Page Size:** A4
- **Margins:** 2cm all sides
- **Font:** Helvetica/Arial
- **Include:** Table of contents, page numbers
- **Quality:** High (for images)

---

**Note:** The Python script (Method 1) provides the best formatting and includes:

- Professional styling
- Page numbers
- Proper page breaks
- Optimized image sizing
- Table of contents
