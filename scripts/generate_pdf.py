#!/usr/bin/env python3
"""
PDF Generator for ONEPA Playout PRO User Manual
Converts the markdown user manual to a professional PDF document
"""

import os
import sys
from pathlib import Path

def generate_pdf():
    """Generate PDF from markdown user manual"""
    
    # Check if required packages are installed
    try:
        import markdown
        from weasyprint import HTML, CSS
    except ImportError:
        print("ERROR: Required packages not installed.")
        print("\nPlease install required packages:")
        print("  pip3 install markdown weasyprint")
        print("\nOr use the browser method:")
        print("  1. Open docs/USER_MANUAL.md in a markdown viewer")
        print("  2. Print to PDF (Cmd+P)")
        print("  3. Save as USER_MANUAL.pdf")
        sys.exit(1)
    
    # Paths
    script_dir = Path(__file__).parent
    docs_dir = script_dir / "docs"
    input_file = docs_dir / "USER_MANUAL.md"
    output_file = docs_dir / "USER_MANUAL.pdf"
    
    if not input_file.exists():
        print(f"ERROR: Input file not found: {input_file}")
        sys.exit(1)
    
    print(f"Reading markdown from: {input_file}")
    
    # Read markdown content
    with open(input_file, 'r', encoding='utf-8') as f:
        md_content = f.read()
    
    # Convert markdown to HTML
    print("Converting markdown to HTML...")
    md = markdown.Markdown(extensions=[
        'extra',
        'codehilite',
        'toc',
        'tables',
        'fenced_code'
    ])
    html_content = md.convert(md_content)
    
    # Create styled HTML document
    styled_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>ONEPA Playout PRO - User Manual</title>
        <style>
            @page {{
                size: A4;
                margin: 2cm;
                @bottom-center {{
                    content: "Page " counter(page) " of " counter(pages);
                    font-size: 10pt;
                    color: #666;
                }}
            }}
            body {{
                font-family: 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 100%;
            }}
            h1 {{
                color: #00e5ff;
                border-bottom: 3px solid #00e5ff;
                padding-bottom: 10px;
                page-break-before: always;
            }}
            h1:first-of-type {{
                page-break-before: avoid;
            }}
            h2 {{
                color: #0099cc;
                border-bottom: 2px solid #e0e0e0;
                padding-bottom: 5px;
                margin-top: 30px;
            }}
            h3 {{
                color: #0066aa;
                margin-top: 20px;
            }}
            img {{
                max-width: 100%;
                height: auto;
                display: block;
                margin: 20px 0;
                border: 1px solid #ddd;
                border-radius: 4px;
            }}
            code {{
                background-color: #f5f5f5;
                padding: 2px 6px;
                border-radius: 3px;
                font-family: 'Courier New', monospace;
                font-size: 0.9em;
            }}
            pre {{
                background-color: #f5f5f5;
                padding: 15px;
                border-radius: 5px;
                border-left: 4px solid #00e5ff;
                overflow-x: auto;
            }}
            table {{
                border-collapse: collapse;
                width: 100%;
                margin: 20px 0;
            }}
            th, td {{
                border: 1px solid #ddd;
                padding: 12px;
                text-align: left;
            }}
            th {{
                background-color: #00e5ff;
                color: white;
                font-weight: bold;
            }}
            tr:nth-child(even) {{
                background-color: #f9f9f9;
            }}
            blockquote {{
                border-left: 4px solid #00e5ff;
                padding-left: 20px;
                margin-left: 0;
                color: #666;
                font-style: italic;
            }}
            .toc {{
                background-color: #f0f8ff;
                padding: 20px;
                border-radius: 5px;
                margin: 20px 0;
            }}
        </style>
    </head>
    <body>
        {html_content}
    </body>
    </html>
    """
    
    # Generate PDF
    print("Generating PDF...")
    HTML(string=styled_html, base_url=str(docs_dir)).write_pdf(
        output_file,
        stylesheets=[CSS(string='@page { size: A4; margin: 2cm; }')]
    )
    
    print(f"\n✅ PDF generated successfully: {output_file}")
    print(f"   File size: {output_file.stat().st_size / 1024 / 1024:.2f} MB")

if __name__ == "__main__":
    try:
        generate_pdf()
    except Exception as e:
        print(f"\n❌ Error generating PDF: {e}")
        print("\nAlternative method:")
        print("  1. Open docs/USER_MANUAL.md in your browser or markdown viewer")
        print("  2. Use Print to PDF (Cmd+P → Save as PDF)")
        sys.exit(1)
