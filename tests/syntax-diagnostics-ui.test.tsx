// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SyntaxDiagnosticsBar } from '../src/components/SyntaxDiagnosticsBar';
import { StatusBar } from '../src/components/StatusBar';
import { SyntaxDiagnostic } from '../src/lib/syntax-validator';

describe('SyntaxDiagnosticsBar Component', () => {
  const sampleDiagnostics: SyntaxDiagnostic[] = [
    {
      id: 'diag-1',
      line: 3,
      column: 15,
      severity: 'error',
      message: '多余的尾随逗号 (Trailing comma in JSON)',
      suggestion: '删除此处的逗号 ","',
      rule: 'json/trailing-comma',
      quickFix: {
        label: '一键移除尾随逗号',
        apply: (code) => code.replace(/,\s*\}/, '}'),
      },
    },
    {
      id: 'diag-2',
      line: 5,
      column: 2,
      severity: 'warning',
      message: 'YAML 建议键名规范',
      suggestion: '使用驼峰或下划线命名',
      rule: 'yaml/warning',
    },
  ];

  it('renders collapsed badge with error counts', () => {
    render(
      React.createElement(SyntaxDiagnosticsBar, {
        language: 'json',
        diagnostics: sampleDiagnostics,
      })
    );

    expect(screen.getByText(/1 个错误/)).toBeDefined();
    expect(screen.getByText(/1 个警告/)).toBeDefined();
    expect(screen.getByText(/查看建议/)).toBeDefined();
  });

  it('expands to show diagnostics list and suggestions when clicked', () => {
    const onNavigateToError = vi.fn();
    const onApplyQuickFix = vi.fn();

    render(
      React.createElement(SyntaxDiagnosticsBar, {
        language: 'json',
        diagnostics: sampleDiagnostics,
        onNavigateToError,
        onApplyQuickFix,
      })
    );

    // Click to expand
    fireEvent.click(screen.getByText(/查看建议/));

    // Panel should now show details
    expect(screen.getByText(/语法诊断 \(JSON\)/)).toBeDefined();
    expect(screen.getByText(/多余的尾随逗号/)).toBeDefined();
    expect(screen.getByText(/删除此处的逗号/)).toBeDefined();

    // Location button
    const locBtn = screen.getByText('L3:C15');
    expect(locBtn).toBeDefined();
    fireEvent.click(locBtn);
    expect(onNavigateToError).toHaveBeenCalledWith(3, 15);

    // Quick fix button
    const quickFixBtn = screen.getByText('一键修复');
    expect(quickFixBtn).toBeDefined();
    fireEvent.click(quickFixBtn);
    expect(onApplyQuickFix).toHaveBeenCalled();
  });

  it('renders clean success badge when no diagnostics in structured format', () => {
    render(
      React.createElement(SyntaxDiagnosticsBar, {
        language: 'json',
        diagnostics: [],
      })
    );

    expect(screen.getByText(/JSON 语法正确/)).toBeDefined();
  });

  it('does not render for plaintext format', () => {
    const { container } = render(
      React.createElement(SyntaxDiagnosticsBar, {
        language: 'plaintext',
        diagnostics: [],
      })
    );

    expect(container.firstChild).toBeNull();
  });
});

describe('StatusBar with Syntax Health & Auto-detect', () => {
  it('renders syntax health badge and auto-detect action', () => {
    const onAutoDetectLanguage = vi.fn();
    const diagnostics: SyntaxDiagnostic[] = [
      {
        id: '1',
        line: 1,
        column: 2,
        severity: 'error',
        message: 'JSON parse error',
      },
    ];

    render(
      React.createElement(StatusBar, {
        language: 'json',
        code: '{\n "test"\n}',
        isDiffMode: false,
        diagnostics,
        onAutoDetectLanguage,
      })
    );

    // Shows 1 error in status bar
    expect(screen.getByText(/1 错误/)).toBeDefined();

    // Auto-detect button
    const autoDetectBtn = screen.getByTitle(/根据文本内容自动识别文件格式/i);
    expect(autoDetectBtn).toBeDefined();
    fireEvent.click(autoDetectBtn);
    expect(onAutoDetectLanguage).toHaveBeenCalledTimes(1);
  });

  it('renders syntax valid when no errors in structured format', () => {
    render(
      React.createElement(StatusBar, {
        language: 'yaml',
        code: 'name: app',
        isDiffMode: false,
        diagnostics: [],
      })
    );

    expect(screen.getByText(/语法有效/)).toBeDefined();
  });
});
