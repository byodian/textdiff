# Cloudflare 部署指南 (Cloudflare Pages & Workers)

本文档介绍如何将 TextDiff 纯前端、本地持久化（Local-First IndexedDB）架构应用发布到 Cloudflare。

---

## 架构优势

1. **零服务器成本与无限扩展**：
   - Next.js 静态单页应用（SSG），静态资源直接分发至 Cloudflare 全球 Anycast CDN 边缘节点。
   - 所有文档、草稿、版本快照 100% 存储在访问者本地浏览器的 IndexedDB 中。
2. **多租户数据零泄漏**：
   - 无中心化共享数据库，公开免登录访问时，每个访问者的数据完全物理隔离在各自本地。
   - 敏感配置、密码或私有代码不会上传至任何后端。
3. **极速 0ms 读写**：
   - 无论网络状况如何，切换文档、保存版本快照、Diff 比对完全在本地内存与 IndexedDB 完成。

---

## 方式一：Cloudflare Pages 关联 GitHub（推荐，最简免维护）

Cloudflare 官方提供 GitHub 自动化构建部署，每次 `git push` 均在 Cloudflare 云端高性能容器中执行构建，**无需在本地运行任何打包命令，彻底避免 WSL 内存溢出**。

### 部署步骤：

1. **登录 Cloudflare 控制台**：
   - 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. **进入 Pages 创建页面**：
   - 在左侧菜单点击 **Workers 和 Pages**（Compute (Workers) & Pages）。
   - 点击 **创建应用程序**（Create application） -> 选择 **Pages** 选项卡。
   - 点击 **连接到 Git**（Connect to Git）。
3. **选择 GitHub 仓库**：
   - 授权并选择 `byodian/textdiff` 仓库。
   - 点击 **开始设置**（Begin setup）。
4. **配置构建参数**：
   - **项目名称**：`textdiff`（或自定义）
   - **生产分支**：`main`（或先选 `feat/local-first-architecture`）
   - **框架预设 (Framework preset)**：选择 `Next.js (Static HTML Export)` 或 `无 (None)`
   - **构建命令 (Build command)**：`next build`
   - **构建输出目录 (Build output directory)**：`out`
   - **环境变量 (Environment variables)**（展开高级设置）：
     - 添加 `NODE_VERSION` = `20`
5. **点击“保存并部署” (Save and Deploy)**：
   - Cloudflare 会自动拉取代码、执行依赖安装和静态导出，几分钟内即可生成全球可访问的 `https://textdiff.pages.dev` 域名，并免费自带 SSL 证书。

---

## 方式二：GitHub Actions 自动持续集成部署

本项目已预置 GitHub Actions 自动化工作流 [`.github/workflows/deploy-cloudflare.yml`](../.github/workflows/deploy-cloudflare.yml)。

### 启用步骤：

1. 在 [Cloudflare API 令牌页面](https://dash.cloudflare.com/profile/api-tokens) 创建一个具有 **Cloudflare Pages: Edit** 权限的 API Token。
2. 在 GitHub 仓库设置（Settings -> Secrets and variables -> Actions）中添加以下两个 Secret：
   - `CLOUDFLARE_API_TOKEN`：你的 Cloudflare API 令牌
   - `CLOUDFLARE_ACCOUNT_ID`：你的 Cloudflare 账户 ID（在控制台主页右侧栏即可查看）
3. 后续只要向 `main` 或 `feat/local-first-architecture` 分支推送代码，GitHub Actions 会自动在云端执行测试、静态导出，并直接将 `out` 目录推送到 Cloudflare Pages！

---

## 方式三：Cloudflare Workers (Static Assets) 命令行发布

若习惯使用 Wrangler 命令行发布到 Cloudflare Workers：

1. 项目根目录已配置 [`wrangler.toml`](../wrangler.toml)：
   ```toml
   name = "textdiff"
   compatibility_date = "2024-09-23"

   [assets]
   directory = "./out"
   not_found_handling = "single-page-application"
   ```
2. 在具备完整资源的非 WSL 环境或云容器中执行构建并发布：
   ```bash
   npx next build
   npx wrangler deploy
   ```

---

## 生产环境数据导入与同步

部署上线后，若需要将原有开发环境数据载入线上浏览器的 IndexedDB：
1. 访问线上部署地址。
2. 点击右上角更多菜单 `···` -> **Import Backup (JSON)**。
3. 选择开发环境导出的 `backup-dev.json` 文件即可一键导入全量工作区和历史版本。
