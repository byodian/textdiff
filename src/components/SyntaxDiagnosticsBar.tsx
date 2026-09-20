'use client';

import React, { useState } from 'react';
import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Lightbulb, 
  Wand2, 
  X,
  ArrowRight
} from 'lucide-react';
import { SyntaxDiagnostic } from '@/lib/syntax-validator';

export interface SyntaxDiagnosticsBarProps {
  language: string;
  diagnostics: SyntaxDiagnostic[];
  onNavigateToError?: (line: number, column: number) => void;
  onApplyQuickFix?: (fixFn: (code: string) => string) => void;
  isExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  isDismissed?: boolean;
  onDismissedChange?: (dismissed: boolean) => void;
}

export const SyntaxDiagnosticsBar: React.FC<SyntaxDiagnosticsBarProps> = ({
  language,
  diagnostics,
  onNavigateToError,
  onApplyQuickFix,
  isExpanded: controlledExpanded,
  onExpandedChange,
  isDismissed: controlledDismissed,
  onDismissedChange,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [internalDismissed, setInternalDismissed] = useState(false);

  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const isDismissed = controlledDismissed !== undefined ? controlledDismissed : internalDismissed;

  const setIsExpanded = (exp: boolean) => {
    setInternalExpanded(exp);
    onExpandedChange?.(exp);
  };

  const setIsDismissed = (dism: boolean) => {
    setInternalDismissed(dism);
    onDismissedChange?.(dism);
  };

  const isStructuredLanguage = ['json', 'yaml', 'yml', 'xml', 'svg', 'html', 'markdown', 'md'].includes(
    language.toLowerCase()
  );

  if (!isStructuredLanguage || isDismissed) {
    return null;
  }

  const errors = diagnostics.filter((d) => d.severity === 'error');
  const warnings = diagnostics.filter((d) => d.severity === 'warning');
  const hasIssues = diagnostics.length > 0;

  return (
    <div className="absolute bottom-3 right-4 z-40 max-w-xl w-[calc(100%-2rem)] sm:w-auto transition-all duration-200">
      {!isExpanded ? (
        // Collapsed Badge / Pill - high contrast across light & dark themes
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-lg border backdrop-blur-md text-xs select-none transition-all cursor-pointer ${
            hasIssues
              ? errors.length > 0
                ? 'bg-rose-900 dark:bg-rose-950 border-rose-600 dark:border-rose-700 text-white shadow-rose-950/20 hover:bg-rose-800 dark:hover:bg-rose-900'
                : 'bg-amber-900 dark:bg-amber-950 border-amber-600 dark:border-amber-700 text-white shadow-amber-950/20 hover:bg-amber-800 dark:hover:bg-amber-900'
              : 'bg-slate-900/90 border-slate-700/70 text-emerald-300 hover:bg-slate-850'
          }`}
          onClick={() => setIsExpanded(true)}
          title={hasIssues ? '点击查看语法诊断详情与修改建议' : '语法校验通过'}
        >
          {hasIssues ? (
            errors.length > 0 ? (
              <AlertCircle className="w-4 h-4 text-rose-200 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-200 shrink-0" />
            )
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}

          <div className="flex items-center gap-1.5 font-medium">
            {hasIssues ? (
              <>
                <span className="text-white font-semibold">
                  {errors.length > 0 && `${errors.length} 个错误`}
                  {errors.length > 0 && warnings.length > 0 && '，'}
                  {warnings.length > 0 && `${warnings.length} 个警告`}
                </span>
                <span className={`text-[11px] font-medium underline underline-offset-2 ml-1 transition-colors ${
                  errors.length > 0
                    ? 'text-rose-100 hover:text-white'
                    : 'text-amber-100 hover:text-white'
                }`}>
                  查看建议
                </span>
              </>
            ) : (
              <span className="text-emerald-300">{language.toUpperCase()} 语法正确</span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
            }}
            className={`p-0.5 rounded hover:bg-white/20 transition-colors ml-1 ${
              errors.length > 0 ? 'text-rose-200 hover:text-white' : 'text-amber-200 hover:text-white'
            }`}
            title="展开语法诊断详情"
            aria-label="展开语法诊断详情"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        // Expanded Panel with Details, Line/Column, Suggestions, and Quick Fixes
        <div className="bg-canvas-elevated border border-canvas-border rounded-xl shadow-2xl backdrop-blur-xl p-3.5 flex flex-col gap-2.5 max-h-96 overflow-hidden w-full sm:w-[480px]">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-canvas-border select-none">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                {errors.length > 0 ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                )}
                语法诊断 ({language.toUpperCase()})
              </span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full font-mono font-medium bg-canvas-surface text-slate-700 dark:text-slate-300 border border-canvas-border">
                {errors.length} 错误 · {warnings.length} 警告
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-canvas-surface transition-colors"
                title="折叠面板"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDismissed(true);
                  setIsExpanded(false);
                }}
                className="p-1 rounded-md text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-canvas-surface transition-colors"
                title="关闭提示"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Diagnostics list */}
          <div className="overflow-y-auto space-y-2.5 pr-1 max-h-72">
            {diagnostics.map((diag) => (
              <div
                key={diag.id}
                className={`p-2.5 rounded-lg border text-xs flex flex-col gap-1.5 transition-colors ${
                  diag.severity === 'error'
                    ? 'bg-rose-50/90 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800/60'
                    : 'bg-amber-50/90 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/60'
                }`}
              >
                {/* Location & Message Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100 min-w-0">
                    <button
                      type="button"
                      onClick={() => onNavigateToError?.(diag.line, diag.column)}
                      className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-white dark:bg-canvas-surface text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-canvas-border hover:border-brand-primary hover:text-brand-primary transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                      title="点击光标跳转至该错误位置"
                    >
                      <span>L{diag.line}:C{diag.column}</span>
                      <ArrowRight className="w-2.5 h-2.5 opacity-60" />
                    </button>
                    <span className="leading-snug truncate sm:whitespace-normal">{diag.message}</span>
                  </div>

                  {/* Quick Fix Button */}
                  {diag.quickFix && onApplyQuickFix && (
                    <button
                      type="button"
                      onClick={() => diag.quickFix && onApplyQuickFix(diag.quickFix.apply)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md font-medium text-[11px] bg-sky-600 hover:bg-sky-500 text-white transition-all shrink-0 shadow-sm cursor-pointer"
                      title={diag.quickFix.label}
                    >
                      <Wand2 className="w-3 h-3" />
                      <span>一键修复</span>
                    </button>
                  )}
                </div>

                {/* Suggestion / 修改建议 */}
                {diag.suggestion && (
                  <div className="flex items-start gap-1.5 bg-white/95 dark:bg-canvas-surface/90 rounded p-2 text-[11px] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-canvas-border/70 shadow-2xs">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1 leading-relaxed">
                      <span className="font-bold text-slate-900 dark:text-slate-100">修改建议：</span>
                      <span className="text-slate-800 dark:text-slate-200">{diag.suggestion}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
