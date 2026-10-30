'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Copy,
  Check,
  ChevronsDownUp,
  ChevronsUpDown,
  PanelRightClose,
  ListTree,
} from 'lucide-react';
import {
  OutlineSegment,
  OutlineCategory,
  OutlineBadgeType,
} from '@/lib/smart-outline';

export interface SmartOutlinePanelProps {
  segments: OutlineSegment[];
  activeLine?: number;
  onSelectSegment: (segment: OutlineSegment) => void;
  onFoldAllBlocks?: () => void;
  onExpandAllBlocks?: () => void;
  onClose: () => void;
}

const BADGE_ORDER: OutlineBadgeType[] = [
  'CREATE',
  'ALTER',
  'DROP',
  'INSERT',
  'UPDATE',
  'DELETE',
  'SQL',
  'YAML',
  'JSON',
  'LINK',
  'HEADING',
  'TEXT',
];

function getBadgeStyle(badge: OutlineBadgeType): string {
  switch (badge) {
    case 'CREATE':
      return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
    case 'ALTER':
      return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    case 'DROP':
    case 'DELETE':
      return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    case 'INSERT':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'UPDATE':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'YAML':
    case 'JSON':
      return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
    case 'LINK':
      return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
    case 'HEADING':
      return 'bg-brand-primary/15 text-brand-primary border-brand-primary/30';
    default:
      return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
  }
}

export const SmartOutlinePanel: React.FC<SmartOutlinePanelProps> = ({
  segments,
  activeLine = 1,
  onSelectSegment,
  onFoldAllBlocks,
  onExpandAllBlocks,
  onClose,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | OutlineCategory>('all');
  const [selectedBadge, setSelectedBadge] = useState<'all' | OutlineBadgeType>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Determine available categories in the current document
  const categoryCounts = useMemo(() => {
    const counts: Record<OutlineCategory, number> = {
      ddl: 0,
      dml: 0,
      config: 0,
      doc: 0,
    };
    for (const seg of segments) {
      counts[seg.category] = (counts[seg.category] || 0) + 1;
    }
    return counts;
  }, [segments]);

  const availableCategories = useMemo(() => {
    const cats: { key: 'all' | OutlineCategory; label: string; count: number }[] = [
      { key: 'all', label: '全部', count: segments.length },
    ];
    if (categoryCounts.ddl > 0) {
      cats.push({ key: 'ddl', label: '建表 DDL', count: categoryCounts.ddl });
    }
    if (categoryCounts.dml > 0) {
      cats.push({ key: 'dml', label: '数据 DML', count: categoryCounts.dml });
    }
    if (categoryCounts.config > 0) {
      cats.push({ key: 'config', label: '配置/服务', count: categoryCounts.config });
    }
    if (categoryCounts.doc > 0) {
      cats.push({ key: 'doc', label: '章节/文本', count: categoryCounts.doc });
    }
    return cats;
  }, [segments.length, categoryCounts]);

  // Sub-category (badge) options when a specific category tab is selected
  const availableBadges = useMemo(() => {
    if (selectedCategory === 'all') return [];
    const categorySegments = segments.filter((s) => s.category === selectedCategory);
    const counts = new Map<OutlineBadgeType, number>();
    for (const seg of categorySegments) {
      counts.set(seg.badge, (counts.get(seg.badge) || 0) + 1);
    }
    const items: { key: 'all' | OutlineBadgeType; label: string; count: number }[] = [
      { key: 'all', label: 'ALL', count: categorySegments.length },
    ];
    for (const badge of BADGE_ORDER) {
      const c = counts.get(badge);
      if (c && c > 0) {
        items.push({ key: badge, label: badge, count: c });
      }
    }
    return items;
  }, [segments, selectedCategory]);

  const handleCategoryChange = (cat: 'all' | OutlineCategory) => {
    setSelectedCategory(cat);
    setSelectedBadge('all');
  };

  const filteredSegments = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    return segments.filter((seg) => {
      if (selectedCategory !== 'all' && seg.category !== selectedCategory) {
        return false;
      }
      if (selectedBadge !== 'all' && seg.badge !== selectedBadge) {
        return false;
      }
      if (!q) return true;
      return (
        seg.title.toLowerCase().includes(q) ||
        seg.subtitle.toLowerCase().includes(q) ||
        seg.badge.toLowerCase().includes(q) ||
        seg.rawText.toLowerCase().includes(q)
      );
    });
  }, [segments, selectedCategory, selectedBadge, filterQuery]);

  const hasMultiLineBlocks = useMemo(
    () => segments.some((seg) => seg.endLine > seg.startLine),
    [segments]
  );

  const handleCopySegment = async (e: React.MouseEvent, seg: OutlineSegment) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(seg.rawText);
      setCopiedId(seg.id);
      setTimeout(() => {
        setCopiedId((prev) => (prev === seg.id ? null : prev));
      }, 1500);
    } catch {
      // Ignore clipboard failures in restricted environments
    }
  };

  return (
    <aside
      aria-label="Smart Outline Panel"
      className="w-72 sm:w-80 h-full shrink-0 border-l border-canvas-border bg-canvas-elevated/85 backdrop-blur-md flex flex-col select-none z-20"
    >
      {/* Top Bar: Title + Fold/Expand Controls + Close */}
      <div className="h-9 px-3 border-b border-canvas-border flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <ListTree className="w-3.5 h-3.5 text-brand-primary shrink-0" />
          <span className="text-xs font-semibold text-slate-100 truncate">
            智能速览
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-canvas-surface border border-canvas-border text-slate-300 font-semibold">
            {segments.length}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {hasMultiLineBlocks && onFoldAllBlocks && (
            <button
              type="button"
              onClick={onFoldAllBlocks}
              className="h-6 px-1.5 rounded text-[11px] text-slate-300 hover:text-white hover:bg-canvas-surface border border-transparent hover:border-canvas-border flex items-center gap-1 transition-colors"
              title="一键折叠所有多行脚本块（一屏纵览全貌）"
              aria-label="折叠长块"
            >
              <ChevronsDownUp className="w-3 h-3 text-brand-primary shrink-0" />
              <span>折叠</span>
            </button>
          )}
          {hasMultiLineBlocks && onExpandAllBlocks && (
            <button
              type="button"
              onClick={onExpandAllBlocks}
              className="h-6 px-1.5 rounded text-[11px] text-slate-300 hover:text-white hover:bg-canvas-surface border border-transparent hover:border-canvas-border flex items-center gap-1 transition-colors"
              title="展开全部已折叠的代码块"
              aria-label="展开全部"
            >
              <ChevronsUpDown className="w-3 h-3 text-slate-400 shrink-0" />
              <span>展开</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="h-6 w-6 rounded text-slate-400 hover:text-slate-100 hover:bg-canvas-surface flex items-center justify-center transition-colors"
            title="收起智能速览栏"
            aria-label="Close Smart Outline"
          >
            <PanelRightClose className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-2 border-b border-canvas-border space-y-1.5 shrink-0">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="搜表名、中文业务词、配置..."
            aria-label="搜索速览段落"
            className="w-full h-7 pl-7 pr-7 rounded bg-canvas-surface border border-canvas-border focus:border-brand-primary text-xs text-slate-100 placeholder:text-slate-400 outline-none transition-colors"
          />
          {filterQuery && (
            <button
              type="button"
              onClick={() => setFilterQuery('')}
              className="absolute right-2 text-slate-400 hover:text-slate-200"
              aria-label="清除搜索"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Primary Category Filter Pills */}
        {availableCategories.length >= 2 && (
          <div
            role="tablist"
            aria-label="大类筛选"
            className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5"
          >
            {availableCategories.map((cat) => {
              const isActive = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleCategoryChange(cat.key)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium shrink-0 transition-colors border ${
                    isActive
                      ? 'bg-brand-primary/15 text-brand-primary border-brand-primary/40 font-semibold'
                      : 'bg-canvas-surface/60 text-slate-400 border-canvas-border/60 hover:text-slate-200'
                  }`}
                >
                  {cat.label} ({cat.count})
                </button>
              );
            })}
          </div>
        )}

        {/* Secondary Sub-Category (Badge) Filter Pills when a category tab is active */}
        {selectedCategory !== 'all' && availableBadges.length > 1 && (
          <div
            role="group"
            aria-label="子类别筛选"
            className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1 border-t border-canvas-border/50"
          >
            {availableBadges.map((item) => {
              const isSubActive = selectedBadge === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={isSubActive}
                  onClick={() =>
                    setSelectedBadge((prev) =>
                      prev === item.key && item.key !== 'all' ? 'all' : item.key
                    )
                  }
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium shrink-0 transition-colors border ${
                    isSubActive
                      ? item.key === 'all'
                        ? 'bg-brand-primary/15 text-brand-primary border-brand-primary/40 font-semibold'
                        : `${getBadgeStyle(item.key)} font-semibold`
                      : 'bg-canvas-surface/40 text-slate-400 border-canvas-border/50 hover:text-slate-200'
                  }`}
                >
                  {item.label} ({item.count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Segment Items List */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
        {filteredSegments.length === 0 ? (
          <div className="py-10 px-4 text-center text-xs text-slate-400">
            {segments.length === 0
              ? '当前文档暂无内容'
              : '未找到匹配的脚本段落'}
          </div>
        ) : (
          filteredSegments.map((seg) => {
            const isActive =
              activeLine >= seg.startLine && activeLine <= seg.endLine;
            const isCopied = copiedId === seg.id;
            const badgeText =
              seg.count && seg.count > 1
                ? `${seg.badge} ×${seg.count}`
                : seg.badge;
            const lineLabel =
              seg.startLine === seg.endLine
                ? `L${seg.startLine}`
                : `L${seg.startLine}–${seg.endLine}`;

            return (
              <div
                key={seg.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectSegment(seg)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectSegment(seg);
                  }
                }}
                style={{ paddingLeft: seg.level > 0 ? '0.85rem' : '0.5rem' }}
                className={`group relative rounded-md pr-2 py-1.5 transition-all cursor-pointer border text-left ${
                  isActive
                    ? 'bg-brand-primary/12 border-brand-primary/50 shadow-xs'
                    : 'bg-canvas-surface/40 border-transparent hover:bg-canvas-surface hover:border-canvas-border'
                }`}
              >
                {/* Row 1: Fixed h-5 height prevents any vertical layout shift on hover */}
                <div className="h-5 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`text-[10px] leading-none font-mono font-semibold px-1.5 py-0.5 rounded border shrink-0 ${getBadgeStyle(
                        seg.badge
                      )}`}
                    >
                      {badgeText}
                    </span>
                    <span
                      className={`text-xs leading-none truncate ${
                        seg.badge === 'HEADING'
                          ? 'font-bold text-slate-100'
                          : 'font-mono font-semibold text-slate-100'
                      }`}
                      title={seg.title}
                    >
                      {seg.title}
                    </span>
                  </div>

                  <div className="h-5 flex items-center justify-end shrink-0">
                    <span
                      className={`text-[10px] leading-none font-mono text-slate-400 ${
                        isCopied ? 'hidden' : 'group-hover:hidden'
                      }`}
                    >
                      {lineLabel}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleCopySegment(e, seg)}
                      className={`h-5 px-1.5 rounded text-[10px] leading-none font-medium items-center gap-1 transition-colors border ${
                        isCopied
                          ? 'flex bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'hidden group-hover:flex bg-canvas-elevated hover:bg-brand-primary hover:text-brand-text text-slate-200 border-canvas-border'
                      }`}
                      title={`复制该段脚本 (${lineLabel})`}
                      aria-label={`复制段落 ${seg.title}`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-2.5 h-2.5 shrink-0" />
                          <span>已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-2.5 h-2.5 shrink-0" />
                          <span>复制</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Row 2: Business Keywords / Subtitle */}
                {seg.subtitle && (
                  <div
                    className="mt-1 text-[11px] leading-tight text-slate-300/90 truncate pl-0.5"
                    title={seg.subtitle}
                  >
                    {seg.subtitle}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
