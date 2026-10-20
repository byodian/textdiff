# Brand Icon Specification: TextDiff Visual Identity

- **Author**: BAI YONGJIAN
- **Date**: 2026-10-08
- **Status**: Implemented

## 1. Overview & Core Concept

**TextDiff** is an online code snippet editor with visual diff and version history inspection. The new brand icon is designed to communicate its core purpose instantly at any resolution (from a 16x16 browser favicon to a 512x512 application icon):

- **Code & Snippets (`< >`)**: Framed by angled code brackets representing syntax, markup, and programming languages.
- **Diff Comparison & Deletion (`-`)**: The left bracket is rendered in radiant Rose Red (`#f43f5e`), encapsulating a clean horizontal minus token representing deletions and baseline revisions.
- **Diff Comparison & Addition (`+`)**: The right bracket is rendered in vibrant Emerald Green (`#10b981`), encapsulating a clean plus token representing additions and current draft modifications.
- **Diff Seam & Version Control (`|` & `Node`)**: A subtle dashed vertical split seam in Electric Cyan (`#38bdf8`) divides the two panes, anchored by a central comparison/commit node representing version snapshots and timeline rollback.
- **Dark Theme Canvas**: A squircle container with a deep midnight navy gradient (`#090e1a` to `#131e33`) with a subtle electric cyan rim matching the application's dark mode palette.

## 2. Generated Assets

| File Path | Format / Size | Purpose |
| :--- | :--- | :--- |
| `src/app/icon.svg` | SVG (512x512 vector) | Next.js 14 App Router 矢量图标（路由 `/icon.svg`） |
| `src/app/favicon.ico` | ICO (16x16, 32x32, 48x48) | Next.js 14 App Router Favicon（路由 `/favicon.ico`） |
| `public/apple-touch-icon.png` | PNG (180x180) | iOS 主屏幕与 Safari 书签高清图标 |
| `public/icon-192.png` | PNG (192x192) | Progressive Web App 标准图标 |
| `public/icon-512.png` | PNG (512x512) | Progressive Web App 高清图标 |
| `src/components/TextDiffLogo.tsx` | React Component | UI 内置矢量组件，渐变 ID 独立隔离 |
| `src/app/manifest.ts` | Next.js Metadata Route | Web Application Manifest 清单声明 |

## 3. UI Integration

- **Metadata**: Registered in [src/app/layout.tsx](file:///home/bbb/projects/personal/apps/textdiff/src/app/layout.tsx) with SVG, ICO, and Apple Touch Icon support.
- **Sidebar**: The brand header in [src/components/Sidebar.tsx](file:///home/bbb/projects/personal/apps/textdiff/src/components/Sidebar.tsx) replaces the temporary generic folder icon with the new `<TextDiffLogo />` component.
