// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  parseSmartOutline,
  extractSqlBusinessKeywords,
  getSemanticFoldingRanges,
} from '../src/lib/smart-outline';
import { SmartOutlinePanel } from '../src/components/SmartOutlinePanel';
import { EditorHeader } from '../src/components/EditorHeader';

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
  });
});
