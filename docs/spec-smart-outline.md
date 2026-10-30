# Zero-Config Smart Outline & Semantic Folding Specification

**Author:** BAI YONGJIAN  
**Status:** Implemented  

## 1. Problem Statement

During a release iteration (e.g., `能源2.4.0发布文档.md`, `能源2.5.0发布文档.sql`, `大港星思网关发布脚本.md`), developers accumulate scripts and configurations for multiple features within a single release document. In daily practice:
- Developers frequently paste raw SQL statements (`INSERT INTO`, `UPDATE`, `CREATE TABLE`), Nacos YAML snippets, and service branch links separated only by blank lines, without manually writing structured Markdown headings or SQL section comments.
- A single table initialization (such as 73 consecutive `INSERT INTO en_energy_saving_report_resource` rows or multi-line `CREATE TABLE` blocks) visually floods the viewport, burying other feature scripts (like `INSERT INTO base_resource` for `AI诊断分析`).
- Asking developers to manually maintain an outline or annotate every pasted block introduces unwanted cognitive load.

## 2. Solution Overview

A **100% Zero-Config Smart Outline Panel (`SmartOutlinePanel`) + Editor Semantic Folding (`FoldingRangeProvider`)** system that automatically segments documents and extracts business keywords directly from code content:

1. **Dual-Boundary Semantic Segmentation (`src/lib/smart-outline.ts`)**:
   - Splits content using **blank lines + syntax/table/statement type boundaries**.
   - Consecutive statements targeting the same SQL table without blank lines (e.g., 73 `INSERT INTO en_energy_saving_report_resource` rows) are grouped into a single segment.
   - Statements separated by blank lines (e.g., two separate batches of `INSERT INTO base_resource` pasted at different times for different features) are preserved as distinct segments so each feature batch can be located and copied independently.
   - Penetrates Markdown headings (`#`–`######`), fenced code blocks (` ```sql `, ` ```yaml `), and raw unfenced SQL/YAML/service URL blocks inside Markdown documents.

2. **Automatic Business Keyword & Comment Extraction**:
   - **SQL Blocks**: Extracts operation type (`CREATE TABLE`, `ALTER TABLE`, `DROP TABLE`, `INSERT ×N`, `UPDATE ×N`, `DELETE ×N`), target table name, preceding SQL comments (`--` or `/* ... */`), and—crucially—**Chinese business literals inside `VALUES (...)`, `WHERE`, `SET`, or `COMMENT '...'`** (e.g., `'报告说明' · '目的' · '标准依据'`, `'AI诊断分析' · '节能诊断报告' · '节能报告模板配置'`).
   - **YAML / JSON Blocks**: Extracts top-level keys and nested section keys with line ranges.
   - **Markdown & Plaintext Blocks**: Extracts headings, service-link pairs, and paragraph summaries.

3. **Right-Side Smart Outline Panel (`src/components/SmartOutlinePanel.tsx`)**:
   - **Header Toggle & Persistence**: Header button (`Outline (N)`) in `EditorHeader` toggles the panel and persists user preference in `localStorage` (`textdiff_smart_outline_open`). Automatically collapses/de-emphasizes when a document has fewer than 2 segments and fewer than 15 lines.
   - **Jump & Highlight (Editor & Markdown Preview)**:
     - Clicking an outline item smoothly scrolls the Monaco Editor to the segment's start line and expands the range if folded.
     - In Markdown **Preview (`preview`)** and **Split (`split`)** modes, `MarkdownPreview` maps each rendered block (`data-start-line`, `data-end-line`) and each line inside fenced code blocks (`data-line`), smoothly scrolling the preview pane to the clicked segment and highlighting the target range.
     - Switching between `Edit`, `Split`, and `Preview` modes preserves the active `SmartOutlinePanel` tab and filter state.
   - **Zero-Jump Hover Copy**: Card header row and action container use a locked `h-5` height so toggling between the line range indicator (`L1–73`) and the hover copy button never causes vertical layout shift.
   - **Two-Level Category & Sub-Type Filter**:
     - Primary tabs: `全部`, `建表 DDL`, `数据 DML`, `配置/服务`, `章节/文本`.
     - Secondary sub-type pills appear when a category tab is selected (e.g., `CREATE` / `ALTER` / `DROP` under `DDL`, `INSERT` / `UPDATE` / `DELETE` under `DML`, `HEADING` / `TEXT` under `章节/文本`).

4. **Semantic Code Folding (`CodeCanvas` + `SmartOutlinePanel`)**:
   - Registers a custom Monaco `FoldingRangeProvider` for all multi-line semantic segments (including consecutive same-table `INSERT`/`UPDATE` batches that standard SQL folding ignores).
   - Keeps code expanded by default on document load to avoid unexpected hidden lines, while providing one-click **Fold All Blocks (`折叠长块`)** and **Expand All (`展开全部`)** controls in the Smart Outline header.
