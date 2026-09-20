# Feature Specification: Editor Format Auto-Adaptation & Syntax Diagnostics

- **Author**: BAI YONGJIAN
- **Date**: 2026-09-20
- **Status**: Implemented

## Problem Statement

When working with diverse structured text formats (such as JSON, YAML, XML, SQL, Markdown, Shell, and TypeScript/JavaScript):
1. **Manual Format Assignment Friction**: Developers frequently paste or type configuration snippets, API responses, or schema definitions into new documents. Documents initially default to `plaintext`, requiring manual trips to language selectors or file renaming to get syntax highlighting and language features.
2. **Opaque Syntax Errors**: In structured formats like JSON or YAML, minor typos (such as trailing commas, single quotes instead of double quotes, unquoted keys, tab characters in indentation, or missing spaces after colons) break parsing. Developers often see silent failures or cryptic syntax errors without exact line/column indicators or actionable guidance on how to fix them.
3. **Lack of In-Place Correction**: Even when an error is identified, users must manually locate the character and fix it. Common mistakes can be corrected automatically via one-click quick fixes.

## Solution

A dual-tier editor enhancement comprising:
1. **Content-Based Format Auto-Adaptation (`detectLanguageFromContent`)**:
   - Automatically inspects text structure, keywords, and syntax patterns on paste or edit in plaintext/untitled documents.
   - Accurately detects JSON, YAML, XML/HTML/SVG, SQL, Markdown, Shell/Bash, Python, TypeScript, JavaScript, CSS, Dockerfile, and Diff/Patch.
   - Automatically adapts document language mode and updates title extensions seamlessly.
   - Provides on-demand auto-detection in the Status Bar and Command Palette.
2. **Universal Syntax Problem Identification & Actionable Diagnostics (`validateSyntax`)**:
   - **JSON Diagnostics**:
     - Trailing commas (`json/trailing-comma`) with one-click removal.
     - Single quotes (`json/single-quote`) with one-click conversion to double quotes.
     - Unquoted property keys (`json/unquoted-key`) with one-click double-quote wrapping.
     - Disallowed comments (`json/no-comments`) with one-click comment removal.
     - Non-standard literal casing (`True`, `False`, `None`) with one-click normalization to `true`, `false`, `null`.
     - Unclosed braces/brackets with structural matching.
   - **YAML Diagnostics**:
     - Strict tab detection in indentation (`yaml/no-tabs`) with one-click conversion to 2 spaces.
     - Missing space after colon (`yaml/missing-space-after-colon`) with one-click fix.
     - Structural and indentation alignment errors with clear hierarchical advice.
     - Duplicate keys and unquoted reserved characters.
   - **XML / HTML Diagnostics**:
     - Mismatched tags, unclosed tags, and unexpected closing tags with line and column accuracy.
   - **Markdown Diagnostics**:
     - Unclosed code fences (` ``` `) with one-click completion.
3. **Interactive Visual Feedback**:
   - **Monaco Inline Markers**: Native red wavy squigglies, error hover tooltips, and overview ruler marks with modification suggestions.
   - **Syntax Diagnostics Bar (`SyntaxDiagnosticsBar.tsx`)**: Floating collapsible badge showing error/warning counts, expandable to view detailed issues, jump to error line/column (`L:C`), view suggestions, and trigger one-click quick fixes.
   - **Status Bar Integration (`StatusBar.tsx`)**: Real-time syntax health badge and manual auto-detect trigger.

## Testing & Verification

Comprehensive automated test suites cover:
- `tests/content-language-detection.test.ts`: Content pattern recognition across all supported languages.
- `tests/syntax-validator.test.ts`: Diagnostic precision, location reporting, suggestion generation, and quick-fix transforms for JSON, YAML, XML, and Markdown.
- `tests/syntax-diagnostics-ui.test.tsx`: UI rendering, error navigation, quick-fix callbacks, and status bar badges.
