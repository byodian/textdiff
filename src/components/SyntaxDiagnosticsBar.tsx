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

interface SyntaxDiagnosticsBarProps {
  language: string;
  diagnostics: SyntaxDiagnostic[];
  onNavigateToError?: (line: number, column: number) => void;
  onApplyQuickFix?: (fixFn: (code: string) => string) => void;
}

export const SyntaxDiagnosticsBar: React.FC<SyntaxDiagnosticsBarProps> = ({
  language,
  diagnostics,
  onNavigateToError,
  onApplyQuickFix,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

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
        // Collapsed Badge / Pill
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-lg border backdrop-blur-md text-xs select-none transition-all cursor-pointer ${
            hasIssues
              ? errors.length > 0
                ? 'bg-rose-950/90 border-rose-700/80 text-rose-200 hover:bg-rose-900/90'
                : 'bg-amber-950/90 border-amber-700/80 text-amber-200 hover:bg-amber-900/90'
              : 'bg-slate-900/90 border-slate-700/70 text-emerald-300 hover:bg-slate-850'
          }`}
          onClick={() => setIsExpanded(true)}
          title={hasIssues ? '点击查看语法诊断详情与修改建议' : '语法校验通过'}
        >
          {hasIssues ? (
            errors.length > 0 ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}

          <div className="flex items-center gap-1.5 font-medium">
            {hasIssues ? (
              <>
                <span>
                  {errors.length > 0 && `${errors.length} 个错误`}
                  {errors.length > 0 && warnings.length > 0 && '，'}
                  {warnings.length > 0 && `${warnings.length} 个警告`}
                </span>
                <span className="text-slate-400 text-[11px] font-normal underline ml-1">
                  查看建议
                </span>
              </>
            ) : (
              <span>{language.toUpperCase()} 语法正确</span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
            }}
            className="p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-slate-200 ml-1"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        // Expanded Panel with Details, Line/Column, Suggestions, and Quick Fixes
        <div className="bg-canvas-elevated/95 border border-canvas-border rounded-xl shadow-2xl backdrop-blur-xl p-3.5 flex flex-col gap-2.5 max-h-96 overflow-hidden w-full sm:w-[480px]">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-canvas-border select-none">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-slate-100 flex items-center gap-1.5">
                {errors.length > 0 ? (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                )}
                语法诊断 ({language.toUpperCase()})
              </span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full font-mono font-medium bg-canvas-surface text-slate-300 border border-canvas-border">
                {errors.length} 错误 · {warnings.length} 警告
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-canvas-surface transition-colors"
                title="折叠面板"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-canvas-surface transition-colors"
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
                    ? 'bg-rose-950/20 border-rose-800/40 text-rose-100'
                    : 'bg-amber-950/20 border-amber-800/40 text-amber-100'
                }`}
              >
                {/* Location & Message Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-100">
                    <button
                      type="button"
                      onClick={() => onNavigateToError?.(diag.line, diag.column)}
                      className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-canvas-surface border border-canvas-border hover:border-brand-primary hover:text-brand-primary transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                      title="点击光标跳转至该错误位置"
                    >
                      <span>L{diag.line}:C{diag.column}</span>
                      <ArrowRight className="w-2.5 h-2.5 opacity-60" />
                    </button>
                    <span className="leading-snug">{diag.message}</span>
                  </div>

                  {/* Quick Fix Button */}
                  {diag.quickFix && onApplyQuickFix && (
                    <button
                      type="button"
                      onClick={() => diag.quickFix && onApplyQuickFix(diag.quickFix.apply)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md font-medium text-[11px] bg-brand-primary text-white hover:bg-brand-primary/90 transition-all shrink-0 shadow-sm"
                      title={diag.quickFix.label}
                    >
                      <Wand2 className="w-3 h-3" />
                      <span>一键修复</span>
                    </button>
                  )}
                </div>

                {/* Suggestion / 修改建议 */}
                {diag.suggestion && (
                  <div className="flex items-start gap-1.5 bg-canvas-surface/80 rounded p-2 text-[11px] text-slate-300 border border-canvas-border/50">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1 leading-relaxed">
                      <span className="font-semibold text-slate-200">修改建议：</span>
                      <span>{diag.suggestion}</span>
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
