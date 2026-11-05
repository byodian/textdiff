// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  parseSmartOutline,
  getSemanticFoldingRanges,
} from '../src/lib/smart-outline';
import { SmartOutlinePanel } from '../src/components/SmartOutlinePanel';
import { EditorHeader } from '../src/components/EditorHeader';
import { CodeCanvas } from '../src/components/CodeCanvas';

describe('Zero-Config Smart Outline & Semantic Folding', () => {
  describe('SQL Semantic Segmentation & Business Keyword Extraction', () => {
    it('groups consecutive same-table INSERT statements without blank lines and extracts Chinese business keywords', () => {
      const sql = [
        "INSERT INTO `en_energy_saving_report_resource` (`id`, `resource_name`, `resource_sort`) VALUES (1, '报告说明', 1);",
        "INSERT INTO `en_energy_saving_report_resource` (`id`, `resource_name`, `resource_sort`) VALUES (2, '目的', 1);",
        "INSERT INTO `en_energy_saving_report_resource` (`id`, `resource_name`, `resource_sort`) VALUES (3, '标准依据', 2);",
        '',
        "INSERT INTO `base_resource` (`id`, `resource_name`, `resource_code`) VALUES (705, 'AI诊断分析', 'ai_diagnosis');",
        "INSERT INTO `base_resource` (`id`, `resource_name`, `resource_code`) VALUES (706, '节能诊断报告', 'energy-diagnosis-report-query');",
        "INSERT INTO `base_resource` (`id`, `resource_name`, `resource_code`) VALUES (707, '节能报告模板配置', 'energy-diagnosis-template-config');",
      ].join('\n');

      const segments = parseSmartOutline(sql, 'sql');
      expect(segments).toHaveLength(2);

      expect(segments[0].badge).toBe('INSERT');
      expect(segments[0].count).toBe(3);
      expect(segments[0].title).toBe('en_energy_saving_report_resource');
      expect(segments[0].subtitle).toContain('报告说明');
      expect(segments[0].subtitle).toContain('目的');
      expect(segments[0].subtitle).toContain('标准依据');
      expect(segments[0].startLine).toBe(1);
      expect(segments[0].endLine).toBe(3);

      expect(segments[1].badge).toBe('INSERT');
      expect(segments[1].count).toBe(3);
      expect(segments[1].title).toBe('base_resource');
      expect(segments[1].subtitle).toBe('AI诊断分析 · 节能诊断报告 · 节能报告模板配置');
      expect(segments[1].startLine).toBe(5);
      expect(segments[1].endLine).toBe(7);
    });

    it('treats blank lines between same-table DML batches as separate feature segments (Rule A)', () => {
      const sql = [
        "INSERT INTO `base_resource` VALUES (611, '油田概览', 'comsumption_statistic');",
        "INSERT INTO `base_resource` VALUES (619, '各分厂目标值录入', 'target-entry');",
        "INSERT INTO `base_resource` VALUES (618, '大港电量管控大屏', 'dagang-screen');",
        '',
        "INSERT INTO `base_resource` VALUES (674, '用能监测', 'device_monitor_2');",
      ].join('\n');

      const segments = parseSmartOutline(sql, 'sql');
      expect(segments).toHaveLength(2);

      expect(segments[0].title).toBe('base_resource');
      expect(segments[0].count).toBe(3);
      expect(segments[0].subtitle).toBe('油田概览 · 各分厂目标值录入 · 大港电量管控大屏');
      expect(segments[0].startLine).toBe(1);
      expect(segments[0].endLine).toBe(3);

      expect(segments[1].title).toBe('base_resource');
      expect(segments[1].count).toBe(1);
      expect(segments[1].subtitle).toBe('用能监测');
      expect(segments[1].startLine).toBe(5);
      expect(segments[1].endLine).toBe(5);
    });

    it('merges DROP TABLE IF EXISTS with CREATE TABLE, skips Navicat boilerplate, and prioritizes business column comments', () => {
      const sql = [
        '/*',
        ' Navicat Premium Data Transfer',
        ' Source Server : 120.26.46.126_3306',
        '*/',
        'SET NAMES utf8mb4;',
        'SET FOREIGN_KEY_CHECKS = 0;',
        '-- ----------------------------',
        '-- Table structure for en_category_month_target_value',
        '-- ----------------------------',
        'DROP TABLE IF EXISTS `en_category_month_target_value`;',
        'CREATE TABLE `en_category_month_target_value` (',
        "  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',",
        "  `statistic_date` varchar(32) NOT NULL COMMENT '标识符',",
        "  `compute_item` varchar(64) NOT NULL COMMENT '计算项',",
        "  `is_deleted` tinyint NOT NULL COMMENT '删除标识；0：未删除；1：删除；',",
        "  `create_time` datetime NULL DEFAULT NULL COMMENT '创建时间',",
        '  PRIMARY KEY (`id`)',
        ') ENGINE = InnoDB;',
      ].join('\n');

      const segments = parseSmartOutline(sql, 'sql');
      expect(segments).toHaveLength(1);
      expect(segments[0].badge).toBe('CREATE');
      expect(segments[0].category).toBe('ddl');
      expect(segments[0].title).toBe('en_category_month_target_value');
      // Generic comments like 主键, 删除标识, 创建时间 should be skipped in favor of 标识符 · 计算项
      expect(segments[0].subtitle).toBe('标识符 · 计算项');
      expect(segments[0].startLine).toBe(10);
      expect(segments[0].endLine).toBe(18);
    });

    it('prioritizes table-level COMMENT for CREATE statements in Markdown DDL blocks and falls back to column COMMENTs when absent', () => {
      const md = [
        '# 计算项异常数据拦截处理',
        '',
        '## MySQL 脚本',
        '',
        '```sql',
        'CREATE TABLE `dc_energy_anomaly_data` (',
        '  `id` bigint unsigned NOT NULL AUTO_INCREMENT,',
        "  `tenant_id` varchar(64) DEFAULT NULL COMMENT '租户ID',",
        "  `station_id` varchar(64) DEFAULT NULL COMMENT '场站ID',",
        "  `device_id` varchar(64) NOT NULL COMMENT '设备ID',",
        "  `compute_item` varchar(64) NOT NULL COMMENT '计算项编码',",
        "  `statistic_value` decimal(28,8) NOT NULL COMMENT '异常统计值(实际用电量)',",
        '  PRIMARY KEY (`id`)',
        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='能源计算异常数据表';",
        '```',
      ].join('\n');

      const segments = parseSmartOutline(md, 'markdown');
      const createSeg = segments.find((s) => s.badge === 'CREATE');
      expect(createSeg).toBeDefined();
      expect(createSeg?.category).toBe('ddl');
      expect(createSeg?.title).toBe('dc_energy_anomaly_data');
      expect(createSeg?.subtitle).toBe('能源计算异常数据表');
    });

    it('penetrates Markdown headings, fenced SQL blocks, and unfenced SQL blocks with exact line numbers', () => {
      const md = [
        '## 服务',
        '',
        'Energy-system',
        'http://192.168.2.62/software-group/energy/energy-system/-/commits/release',
        '',
        '## SQL脚本',
        '```sql',
        "UPDATE base_resource SET resource_sort=2 WHERE id=79 AND resource_name='用能监管';",
        "UPDATE base_resource SET resource_sort=3 WHERE id=674 AND resource_name='用能监测';",
        '',
        "INSERT INTO `base_resource` VALUES (611, '油田概览');",
        '```',
      ].join('\n');

      const segments = parseSmartOutline(md, 'markdown');
      expect(segments).toHaveLength(5);

      expect(segments[0].badge).toBe('HEADING');
      expect(segments[0].title).toBe('服务');
      expect(segments[0].startLine).toBe(1);

      expect(segments[1].badge).toBe('LINK');
      expect(segments[1].title).toBe('Energy-system');
      expect(segments[1].startLine).toBe(3);
      expect(segments[1].endLine).toBe(4);

      expect(segments[2].badge).toBe('HEADING');
      expect(segments[2].title).toBe('SQL脚本');
      expect(segments[2].startLine).toBe(6);

      expect(segments[3].badge).toBe('UPDATE');
      expect(segments[3].title).toBe('base_resource');
      expect(segments[3].count).toBe(2);
      expect(segments[3].subtitle).toBe('用能监管 · 用能监测');
      expect(segments[3].startLine).toBe(8);
      expect(segments[3].endLine).toBe(9);

      expect(segments[4].badge).toBe('INSERT');
      expect(segments[4].title).toBe('base_resource');
      expect(segments[4].subtitle).toBe('油田概览');
      expect(segments[4].startLine).toBe(11);
      expect(segments[4].endLine).toBe(11);

      const foldRanges = getSemanticFoldingRanges(segments);
      expect(foldRanges).toEqual([
        { start: 3, end: 4 },
        { start: 8, end: 9 },
      ]);
    });

    it('parses YAML and JSON configuration documents into navigable segments', () => {
      const yaml = [
        'energy:',
        '  compute:',
        '    anomaly:',
        '      enabled: true',
        '      min-threshold: 0',
      ].join('\n');

      const yamlSegs = parseSmartOutline(yaml, 'yaml');
      expect(yamlSegs.length).toBeGreaterThanOrEqual(1);
      expect(yamlSegs[0].badge).toBe('YAML');
      expect(yamlSegs[0].title).toBe('energy');

      const json = JSON.stringify(
        {
          productKey: 'PAELRHrQ53U',
          gatewayName: '星思网关',
        },
        null,
        2
      );
      const jsonSegs = parseSmartOutline(json, 'json');
      expect(jsonSegs).toHaveLength(2);
      expect(jsonSegs[0].title).toBe('productKey');
      expect(jsonSegs[1].title).toBe('gatewayName');
      expect(jsonSegs[1].subtitle).toContain('星思网关');
    });
  });

  describe('SmartOutlinePanel Component Interactions', () => {
    const sampleSql = [
      'CREATE TABLE `dc_energy_anomaly_data` (',
      "  `id` bigint NOT NULL COMMENT '主键',",
      "  `compute_item` varchar(64) NOT NULL COMMENT '计算项编码',",
      "  `statistic_value` decimal(28,8) NOT NULL COMMENT '异常统计值'",
      ');',
      '',
      "INSERT INTO `base_resource` VALUES (705, 'AI诊断分析', 'ai_diagnosis');",
      "INSERT INTO `base_resource` VALUES (706, '节能诊断报告', 'report_query');",
    ].join('\n');

    const segments = parseSmartOutline(sampleSql, 'sql');

    beforeEach(() => {
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      });
    });

    it('renders segments, filters by keyword and category, jumps on click, and copies segment text', async () => {
      const onSelectSegment = vi.fn();
      const onFoldAllBlocks = vi.fn();
      const onExpandAllBlocks = vi.fn();
      const onClose = vi.fn();

      render(
        <SmartOutlinePanel
          segments={segments}
          activeLine={7}
          onSelectSegment={onSelectSegment}
          onFoldAllBlocks={onFoldAllBlocks}
          onExpandAllBlocks={onExpandAllBlocks}
          onClose={onClose}
        />
      );

      // Renders both segments with extracted subtitles
      expect(screen.getByText('dc_energy_anomaly_data')).toBeDefined();
      expect(screen.getByText('计算项编码 · 异常统计值')).toBeDefined();
      expect(screen.getByText('base_resource')).toBeDefined();
      expect(screen.getByText('AI诊断分析 · 节能诊断报告')).toBeDefined();

      // Clicking a segment triggers jump handler
      fireEvent.click(screen.getByText('dc_energy_anomaly_data'));
      expect(onSelectSegment).toHaveBeenCalledWith(segments[0]);

      // Clicking Fold / Expand buttons triggers handlers
      fireEvent.click(screen.getByRole('button', { name: '折叠长块' }));
      expect(onFoldAllBlocks).toHaveBeenCalledTimes(1);
      fireEvent.click(screen.getByRole('button', { name: '展开全部' }));
      expect(onExpandAllBlocks).toHaveBeenCalledTimes(1);

      // Copy single segment button copies exact segment SQL
      const copyBtn = screen.getByRole('button', { name: '复制段落 base_resource' });
      fireEvent.click(copyBtn);
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(segments[1].rawText);
      });

      // Category filtering: click 建表 DDL
      fireEvent.click(screen.getByText(/建表 DDL/));
      expect(screen.getByText('dc_energy_anomaly_data')).toBeDefined();
      expect(screen.queryByText('base_resource')).toBeNull();

      // Switch back to 全部 and filter by Chinese business keyword
      fireEvent.click(screen.getByText(/全部/));
      const searchInput = screen.getByLabelText('搜索速览段落');
      fireEvent.change(searchInput, { target: { value: 'AI诊断' } });
      expect(screen.queryByText('dc_energy_anomaly_data')).toBeNull();
      expect(screen.getByText('base_resource')).toBeDefined();
    });

    it('renders Smart Outline toggle button in EditorHeader with segment count badge', () => {
      const onToggleOutline = vi.fn();
      render(
        <EditorHeader
          title="能源2.5.0发布文档.sql"
          isDiffMode={false}
          diffStats={{ added: 0, removed: 0, hasChanges: false }}
          hasUnsavedChanges={false}
          copiedCode={false}
          copiedDiff={false}
          onTitleChange={vi.fn()}
          onTitleBlur={vi.fn()}
          onToggleDiffMode={vi.fn()}
          onOpenHistory={vi.fn()}
          onSavePrompt={vi.fn()}
          onFormatDocument={vi.fn()}
          onCopyContent={vi.fn()}
          onCopyDiff={vi.fn()}
          isOutlineOpen={true}
          outlineCount={8}
          onToggleOutline={onToggleOutline}
        />
      );

      const toggleBtn = screen.getByRole('button', { name: 'Toggle Smart Outline' });
      expect(toggleBtn).toBeDefined();
      expect(toggleBtn.getAttribute('aria-pressed')).toBe('true');
      expect(screen.getByText('8')).toBeDefined();

      fireEvent.click(toggleBtn);
      expect(onToggleOutline).toHaveBeenCalledTimes(1);
    });

    it('locks card first row and right action container to h-5 to prevent hover height jump', () => {
      render(
        <SmartOutlinePanel
          segments={segments}
          activeLine={1}
          onSelectSegment={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const firstCardTitle = screen.getByText('dc_energy_anomaly_data');
      const row1 = firstCardTitle.closest('.h-5');
      expect(row1).not.toBeNull();
      expect(row1?.className).toContain('h-5');

      const copyBtn = screen.getByRole('button', {
        name: '复制段落 dc_energy_anomaly_data',
      });
      expect(copyBtn.className).toContain('h-5');
      expect(copyBtn.parentElement?.className).toContain('h-5');
    });

    it('filters by secondary sub-categories (CREATE vs ALTER under DDL, HEADING vs TEXT under 章节/文本)', () => {
      const mixedDoc = [
        '## 数据库变更说明',
        '',
        '本次迭代包含建表与字段修改脚本。',
        '',
        '```sql',
        'CREATE TABLE `t_new_report` (`id` bigint PRIMARY KEY);',
        '',
        'ALTER TABLE `t_old_report` ADD COLUMN `status` tinyint DEFAULT 0;',
        '```',
      ].join('\n');

      const mixedSegments = parseSmartOutline(mixedDoc, 'markdown');
      render(
        <SmartOutlinePanel
          segments={mixedSegments}
          activeLine={1}
          onSelectSegment={vi.fn()}
          onClose={vi.fn()}
        />
      );

      // Initially on "全部", secondary filter bar is hidden
      expect(screen.queryByRole('group', { name: '子类别筛选' })).toBeNull();

      // Switch to "建表 DDL" tab -> shows CREATE and ALTER sub-filter pills
      fireEvent.click(screen.getByRole('tab', { name: /建表 DDL/ }));
      const subGroupDdl = screen.getByRole('group', { name: '子类别筛选' });
      expect(subGroupDdl).toBeDefined();

      // Click ALTER sub-filter -> only t_old_report is shown
      fireEvent.click(screen.getByRole('button', { name: 'ALTER (1)' }));
      expect(screen.getByText('t_old_report')).toBeDefined();
      expect(screen.queryByText('t_new_report')).toBeNull();

      // Click CREATE sub-filter -> only t_new_report is shown
      fireEvent.click(screen.getByRole('button', { name: 'CREATE (1)' }));
      expect(screen.getByText('t_new_report')).toBeDefined();
      expect(screen.queryByText('t_old_report')).toBeNull();

      // Switch to "章节/文本" tab -> sub-filter resets to 全部 and shows HEADING and TEXT
      fireEvent.click(screen.getByRole('tab', { name: /章节\/文本/ }));
      expect(screen.getByText('数据库变更说明')).toBeDefined();
      expect(screen.getByText('本次迭代包含建表与字段修改脚本。')).toBeDefined();

      // Filter by HEADING only
      fireEvent.click(screen.getByRole('button', { name: 'HEADING (1)' }));
      expect(screen.getByText('数据库变更说明')).toBeDefined();
      expect(screen.queryByText('本次迭代包含建表与字段修改脚本。')).toBeNull();

      // Filter by TEXT only
      fireEvent.click(screen.getByRole('button', { name: 'TEXT (1)' }));
      expect(screen.queryByText('数据库变更说明')).toBeNull();
      expect(screen.getByText('本次迭代包含建表与字段修改脚本。')).toBeDefined();
    });

    it('renders heading level badges (H1~H6), parent breadcrumb subtitles without indentation, and H1/H2/H3 tertiary filter under 章节/文本 -> HEADING', () => {
      const mdWithHierarchy = [
        '# 能源2.5.0开发计划',
        '',
        '## 接口',
        '节能报告损耗分析数据接口开发',
        '',
        '## 电能数据新增',
        '',
        '### 费用',
        '总电费用数据统计公式',
        '',
        '### 复费率',
        '返回各用能时段的用电量',
      ].join('\n');

      const hierarchySegments = parseSmartOutline(mdWithHierarchy, 'markdown');
      const headingSegments = hierarchySegments.filter((s) => s.badge === 'HEADING');
      expect(
        headingSegments.map((h) => ({
          title: h.title,
          headingLevel: h.headingLevel,
          subtitle: h.subtitle,
        }))
      ).toEqual([
        { title: '能源2.5.0开发计划', headingLevel: 1, subtitle: '章节标题 (H1)' },
        { title: '接口', headingLevel: 2, subtitle: '能源2.5.0开发计划' },
        { title: '电能数据新增', headingLevel: 2, subtitle: '能源2.5.0开发计划' },
        { title: '费用', headingLevel: 3, subtitle: '能源2.5.0开发计划 › 电能数据新增' },
        { title: '复费率', headingLevel: 3, subtitle: '能源2.5.0开发计划 › 电能数据新增' },
      ]);

      render(
        <SmartOutlinePanel
          segments={hierarchySegments}
          activeLine={1}
          onSelectSegment={vi.fn()}
          onClose={vi.fn()}
        />
      );

      // Cards render H1, H2, H3 badges and stay strictly left-aligned (no inline paddingLeft indentation)
      const h1Card = screen.getAllByText('能源2.5.0开发计划')[0].closest('[role="button"]') as HTMLElement;
      const h2Card = screen.getByText('电能数据新增').closest('[role="button"]') as HTMLElement;
      const h3Card = screen.getByText('费用').closest('[role="button"]') as HTMLElement;
      expect(h1Card.getAttribute('data-heading-level')).toBe('1');
      expect(h2Card.getAttribute('data-heading-level')).toBe('2');
      expect(h3Card.getAttribute('data-heading-level')).toBe('3');
      expect(h1Card.style.paddingLeft).toBe('');
      expect(h2Card.style.paddingLeft).toBe('');
      expect(h3Card.style.paddingLeft).toBe('');
      expect(screen.getAllByText('能源2.5.0开发计划 › 电能数据新增')).toHaveLength(2);

      // Switch to 章节/文本 -> HEADING to reveal H1 / H2 / H3 filter pills
      fireEvent.click(screen.getByRole('tab', { name: /章节\/文本/ }));
      fireEvent.click(screen.getByRole('button', { name: 'HEADING (5)' }));

      const levelGroup = screen.getByRole('group', { name: '标题层级筛选' });
      expect(levelGroup).toBeDefined();

      // Filter by H3 only -> only 费用 and 复费率 are shown with their parent breadcrumb context
      fireEvent.click(screen.getByRole('button', { name: 'H3 (2)' }));
      expect(screen.getByText('费用')).toBeDefined();
      expect(screen.getByText('复费率')).toBeDefined();
      expect(screen.queryByText('接口')).toBeNull();

      // Filter by H2 only -> only 接口 and 电能数据新增 are shown
      fireEvent.click(screen.getByRole('button', { name: 'H2 (2)' }));
      expect(screen.getByText('接口')).toBeDefined();
      expect(screen.getByText('电能数据新增')).toBeDefined();
      expect(screen.queryByText('费用')).toBeNull();
    });

    it('scrolls and highlights target block or code line in MarkdownPreview when selecting outline item in Preview mode', () => {
      const mdContent = [
        '## 服务列表',
        '',
        'Energy-system 发布分支说明',
        '',
        '## SQL脚本',
        '```sql',
        "UPDATE base_resource SET resource_sort=2 WHERE resource_name='用能监管';",
        '',
        "INSERT INTO base_resource VALUES (705, 'AI诊断分析');",
        '```',
      ].join('\n');

      const scrollIntoViewMock = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      const editorRef = { current: null };
      const diffEditorRef = { current: null };

      const { container } = render(
        <CodeCanvas
          language="markdown"
          code={mdContent}
          originalCode={mdContent}
          isDiffMode={false}
          isSideBySide={true}
          markdownViewMode="preview"
          onCodeChange={vi.fn()}
          editorRef={editorRef}
          diffEditorRef={diffEditorRef}
          isOutlineOpen={true}
        />
      );

      // Filter to 数据 DML in Smart Outline while in Preview mode
      fireEvent.click(screen.getByRole('tab', { name: /数据 DML/ }));
      fireEvent.click(screen.getByRole('button', { name: 'INSERT (1)' }));

      // Click the INSERT segment in Smart Outline
      const insertSubtitle = screen.getByText('AI诊断分析');
      fireEvent.click(insertSubtitle);

      expect(scrollIntoViewMock).toHaveBeenCalled();
      // Line 9 inside the fenced SQL block should have data-line="9" and highlight styling
      const line9El = container.querySelector('[data-line="9"]');
      expect(line9El).not.toBeNull();
      expect(line9El?.className).toContain('bg-[var(--preview-brand)]/20');
    });
  });
});
