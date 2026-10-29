# Document Export Feature Specification (Raw, PDF, DOCX)

**Author:** BAI YONGJIAN  
**Status:** Implemented  

## Overview

Provides multi-format file export capabilities from the editor canvas, allowing users to download their active documents either in their original code/text formats or converted into styled printable PDFs and Microsoft Word (.docx) documents (for Markdown files).

## Supported Formats

1. **Raw Document Export (原样导出)**:
   - Supports all code and text formats (`.ts`, `.py`, `.json`, `.sql`, `.md`, `.html`, `.css`, etc.).
   - Retains exact document content and determines proper extension and MIME type using `splitTitleAndExtension`.
2. **Markdown to PDF Export (.pdf)**:
   - Available when the document is Markdown (`language === 'markdown'` or ending with `.md`/`.markdown`).
   - Uses an AST-driven vector PDF renderer (`src/lib/markdown-to-pdf.ts`) powered by `marked.lexer` and `jsPDF` (`compress: true`) to trigger an immediate client-side file download without opening the browser print dialog.
   - Produces genuine vector text (selectable, searchable, editable) with automatic Latin (`Helvetica` / `Courier`) and subsetted CJK TrueType font (`DroidSansFallback.ttf` via `Identity-H` + `/ToUnicode` CMap) script splitting, preserving line breaks, indentation, inline code pills, code blocks, blockquotes, lists, tables, and interactive clickable `/Link` annotations.
3. **Markdown to Word Document Export (.docx)**:
   - Converts Markdown AST tokens (`marked.lexer` with `gfm: true, breaks: true`) into a structured Microsoft Word OpenXML document via `docx`.
   - Supports headings (H1-H6 with semantic levels), bold/italic/strikethrough/code styling, explicit line breaks (`<w:br/>`) and preserved indentation, nested ordered/bullet lists, fenced code blocks with shading and borders, styled blockquotes, and data tables.

## User Interface Seams

- **More Actions Menu (`...`)**: Contextual export options (`Export File`, `Export as PDF (.pdf)`, `Export as Word (.docx)`) integrated into the header's ellipsis dropdown menu.
- **Command Palette (`Ctrl+K`)**: `Export: Document (Raw / As-Is)`, `Export: Markdown as PDF (.pdf)`, and `Export: Markdown as Word (.docx)` commands with live filtering.
- **Toast Notifications**: Feedback during PDF/DOCX generation and completion toasts showing exported filenames.

## Architecture & Verification

- `src/lib/export-utils.ts`: Core export orchestration, direct browser download trigger (`triggerFileDownload`), and MIME/filename resolution.
- `src/lib/markdown-to-pdf.ts`: Markdown AST to vector PDF renderer with CJK TTF font subsetting and clickable link annotations.
- `src/lib/markdown-to-docx.ts`: Markdown lexer token conversion to `docx` Document models.
- `tests/export-utils.test.ts`: Unit tests covering format detection, filename resolution, raw blob generation, docx generation, and vector PDF generation.
- `tests/editor-header-export.test.tsx`: Integration tests for header `More actions (...)` export dropdown interactions.
- `tests/command-palette-export.test.tsx`: Integration tests for command palette export triggers.
