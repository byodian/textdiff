import { jsPDF } from 'jspdf';
import { Marked, Lexer, type Token, type Tokens } from 'marked';

const CJK_FONT_VFS_NAME = 'DroidSansFallback.ttf';
const CJK_FONT_NAME = 'DroidSansFallback';

const SYMBOL_FONT_VFS_NAME = 'DejaVuSans.ttf';
const SYMBOL_FONT_NAME = 'DejaVuSans';

let cachedCjkFontBase64: string | null = null;
let cachedSymbolFontBase64: string | null = null;

/**
 * Normalizes line endings, tabs, invisible variation selectors, and supplemental-plane
 * emoji symbols into BMP Unicode equivalents supported by DejaVuSans / DroidSansFallback.
 */
function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, '  ')
    .replace(/\u00A0/g, ' ')
    .replace(/[\uFE00-\uFE0F\u200B-\u200D\uFEFF]/g, '')
    .replace(/\u2705/g, '\u2714') // ✅ -> ✔
    .replace(/\u2611/g, '\u2713') // ☑ -> ✓
    .replace(/[\u274C\u274E]/g, '\u2718') // ❌/❎ -> ✘
    .replace(/[\uD83D][\uDD39\uDD37]/g, '\u25C6') // 🔹/🔷 -> ◆
    .replace(/[\uD83D][\uDD38\uDD36]/g, '\u25C7') // 🔸/🔶 -> ◇
    .replace(/[\uD83D][\uDFE2\uDD34\uDFE1\uDD35]|\u26AB/g, '\u25CF') // colored circles -> ●
    .replace(/\u26AA/g, '\u25CB') // ⚪ -> ○
    .replace(/\uD83D\uDC49|\u27A1/g, '\u2192') // 👉/➡ -> →
    .replace(/\uD83D\uDC48|\u2B05/g, '\u2190') // 👈/⬅ -> ←
    .replace(/\u2B06/g, '\u2191') // ⬆ -> ↑
    .replace(/\u2B07/g, '\u2193') // ⬇ -> ↓
    .replace(/[\uD83D][\uDCCC\uDCCD\uDCA1]|\uD83C\uDFAF/g, '\u2022') // 📌/📍/💡/🎯 -> •
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '\u2022'); // other astral emojis -> •
}

/**
 * Checks whether a string contains any non-ASCII characters requiring Unicode TTF fonts.
 */
function hasNonAscii(text?: string | null): boolean {
  if (!text) return false;
  return /[^\x00-\x7F]/.test(text);
}

/**
 * Converts an ArrayBuffer to a base64 string without overflowing the call stack.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  const chunks: string[] = [];
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    chunks.push(String.fromCharCode.apply(null, slice as unknown as number[]));
  }
  const binary = chunks.join('');
  if (typeof btoa === 'function') {
    return btoa(binary);
  }
  return Buffer.from(buffer).toString('base64');
}

/**
 * Helper to load a TrueType font file as base64 from browser fetch or Node.js fs fallback.
 */
async function loadFontFileBase64(
  publicPath: string,
  nodeCandidates: string[]
): Promise<string | null> {
  // 1. Try browser fetch when running in a real browser environment
  if (typeof window !== 'undefined' && typeof fetch === 'function') {
    try {
      const res = await fetch(publicPath);
      if (res.ok) {
        const buf = await res.arrayBuffer();
        if (buf.byteLength > 1000) {
          return arrayBufferToBase64(buf);
        }
      }
    } catch {
      // Fall through to Node fs fallback (e.g. in JSDOM / Vitest)
    }
  }

  // 2. Try Node.js filesystem fallback for Vitest / JSDOM / SSR
  if (typeof process !== 'undefined' && process.versions?.node) {
    try {
      const proc = process as unknown as {
        getBuiltinModule?: (id: string) => unknown;
      };
      const loadBuiltin =
        typeof proc.getBuiltinModule === 'function'
          ? (id: string) => proc.getBuiltinModule!(id)
          : (Function('return require')() as (id: string) => unknown);
      const fs = loadBuiltin('fs') as {
        existsSync: (p: string) => boolean;
        readFileSync: (p: string) => Buffer;
      };
      const path = loadBuiltin('path') as {
        join: (...parts: string[]) => string;
      };
      for (const relOrAbs of nodeCandidates) {
        const candidate = relOrAbs.startsWith('/')
          ? relOrAbs
          : path.join(process.cwd(), relOrAbs);
        if (fs.existsSync(candidate)) {
          return fs.readFileSync(candidate).toString('base64');
        }
      }
    } catch {
      // Ignore if fs is unavailable
    }
  }

  return null;
}

/**
 * Lazily loads the CJK TrueType font (DroidSansFallback.ttf) as base64 and caches it.
 */
async function loadCjkFontBase64(): Promise<string | null> {
  if (cachedCjkFontBase64) return cachedCjkFontBase64;
  cachedCjkFontBase64 = await loadFontFileBase64(`/fonts/${CJK_FONT_VFS_NAME}`, [
    `public/fonts/${CJK_FONT_VFS_NAME}`,
    '/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf',
  ]);
  return cachedCjkFontBase64;
}

/**
 * Lazily loads the Unicode Symbol TrueType font (DejaVuSans.ttf) as base64 and caches it.
 */
async function loadSymbolFontBase64(): Promise<string | null> {
  if (cachedSymbolFontBase64) return cachedSymbolFontBase64;
  cachedSymbolFontBase64 = await loadFontFileBase64(`/fonts/${SYMBOL_FONT_VFS_NAME}`, [
    `public/fonts/${SYMBOL_FONT_VFS_NAME}`,
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  ]);
  return cachedSymbolFontBase64;
}

interface InlineSpan {
  text: string;
  bold?: boolean;
  italic?: boolean;
  strike?: boolean;
  code?: boolean;
  linkUrl?: string;
  isLineBreak?: boolean;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface RenderContext {
  pdf: jsPDF;
  hasCjkFont: boolean;
  cjkGlyphCheck: ((code: number) => boolean) | null;
  hasSymbolFont: boolean;
  symbolGlyphCheck: ((code: number) => boolean) | null;
  pageWidth: number;
  pageHeight: number;
  margin: number;
  contentWidth: number;
  cursorY: number;
}

/**
 * Splits plain text that may contain bare URLs (https://...) into text and link spans.
 */
function splitTextWithBareUrls(text: string, baseStyle: Omit<InlineSpan, 'text'>): InlineSpan[] {
  const normalized = normalizeText(text);
  const urlRegex = /(https?:\/\/[^\s<>()]+[^\s<>().,;:!?"'\])}])/g;
  const spans: InlineSpan[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = urlRegex.exec(normalized)) !== null) {
    if (match.index > lastIndex) {
      spans.push({ ...baseStyle, text: normalized.slice(lastIndex, match.index) });
    }
    spans.push({
      ...baseStyle,
      text: match[1],
      linkUrl: baseStyle.linkUrl || match[1],
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < normalized.length) {
    spans.push({ ...baseStyle, text: normalized.slice(lastIndex) });
  }

  return spans;
}

/**
 * Appends text to the span list, splitting on '\n' into explicit line break tokens.
 */
function pushTextWithNewlines(
  spans: InlineSpan[],
  rawText: string,
  style: Omit<InlineSpan, 'text'>
): void {
  const normalized = normalizeText(rawText);
  const lines = normalized.split('\n');
  lines.forEach((line, idx) => {
    if (idx > 0) {
      spans.push({ text: '', isLineBreak: true });
    }
    if (line.length > 0) {
      if (style.code || style.linkUrl) {
        spans.push({ ...style, text: line });
      } else {
        spans.push(...splitTextWithBareUrls(line, style));
      }
    }
  });
}

/**
 * Recursively flattens Marked inline tokens into styled InlineSpan items.
 */
function flattenInlineTokens(
  tokens: Token[] = [],
  style: Omit<InlineSpan, 'text'> = {}
): InlineSpan[] {
  const spans: InlineSpan[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case 'strong': {
        const strongTok = token as Tokens.Strong;
        spans.push(...flattenInlineTokens(strongTok.tokens || [], { ...style, bold: true }));
        break;
      }
      case 'em': {
        const emTok = token as Tokens.Em;
        spans.push(...flattenInlineTokens(emTok.tokens || [], { ...style, italic: true }));
        break;
      }
      case 'del': {
        const delTok = token as Tokens.Del;
        spans.push(...flattenInlineTokens(delTok.tokens || [], { ...style, strike: true }));
        break;
      }
      case 'codespan': {
        const codeTok = token as Tokens.Codespan;
        pushTextWithNewlines(spans, codeTok.text || '', { ...style, code: true });
        break;
      }
      case 'link': {
        const linkTok = token as Tokens.Link;
        const href = linkTok.href || '';
        if (linkTok.tokens && linkTok.tokens.length > 0) {
          spans.push(...flattenInlineTokens(linkTok.tokens, { ...style, linkUrl: href }));
        } else {
          pushTextWithNewlines(spans, linkTok.text || href, { ...style, linkUrl: href });
        }
        break;
      }
      case 'image': {
        const imgTok = token as Tokens.Image;
        const label = `[Image: ${imgTok.text || imgTok.href || 'image'}]`;
        pushTextWithNewlines(spans, label, {
          ...style,
          italic: true,
          linkUrl: imgTok.href || undefined,
        });
        break;
      }
      case 'br': {
        spans.push({ text: '', isLineBreak: true });
        break;
      }
      case 'escape': {
        const escTok = token as Tokens.Escape;
        pushTextWithNewlines(spans, escTok.text || '', style);
        break;
      }
      case 'text': {
        const textTok = token as Tokens.Text;
        if (textTok.tokens && textTok.tokens.length > 0) {
          spans.push(...flattenInlineTokens(textTok.tokens, style));
        } else {
          pushTextWithNewlines(spans, textTok.text || '', style);
        }
        break;
      }
      default: {
        const anyTok = token as { text?: string; raw?: string; tokens?: Token[] };
        if (anyTok.tokens && anyTok.tokens.length > 0) {
          spans.push(...flattenInlineTokens(anyTok.tokens, style));
        } else {
          pushTextWithNewlines(spans, anyTok.text || anyTok.raw || '', style);
        }
        break;
      }
    }
  }

  return spans;
}

type ScriptKind = 'latin' | 'cjk' | 'symbol';

interface ScriptRun {
  kind: ScriptKind;
  text: string;
}

/**
 * Checks whether a Unicode code point belongs to a CJK block where DroidSansFallback
 * should be preferred over DejaVuSans.
 */
function isCjkCodePoint(code: number): boolean {
  return (
    (code >= 0x2e80 && code <= 0x9fff) ||
    (code >= 0xac00 && code <= 0xd7af) ||
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0xfe30 && code <= 0xfe4f) ||
    (code >= 0xff00 && code <= 0xffef)
  );
}

/**
 * Splits a string into contiguous Latin, Symbol, and CJK script runs so:
 * - ASCII uses native Helvetica/Courier (with true bold/italic/monospace)
 * - Unicode symbols (•, ◦, ▪, ✓, ✔, ✘, →, —, “”, …, box-drawing, etc.) use DejaVuSans
 * - CJK ideographs and CJK fullwidth punctuation use DroidSansFallback
 */
function splitIntoScriptRuns(ctx: RenderContext, text: string): ScriptRun[] {
  const runs: ScriptRun[] = [];
  if (!text) return runs;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const code = ch.charCodeAt(0);
    let kind: ScriptKind = 'latin';
    let safeChar = ch;

    if (code > 0x007e) {
      if (isCjkCodePoint(code)) {
        if (ctx.hasCjkFont && ctx.cjkGlyphCheck?.(code)) {
          kind = 'cjk';
        } else if (ctx.hasSymbolFont && ctx.symbolGlyphCheck?.(code)) {
          kind = 'symbol';
        } else {
          safeChar = '?';
          kind = 'latin';
        }
      } else {
        if (ctx.hasSymbolFont && ctx.symbolGlyphCheck?.(code)) {
          kind = 'symbol';
        } else if (ctx.hasCjkFont && ctx.cjkGlyphCheck?.(code)) {
          kind = 'cjk';
        } else if (code <= 0x00ff) {
          kind = 'latin';
        } else {
          safeChar = '?';
          kind = 'latin';
        }
      }
    }

    if (runs.length === 0 || runs[runs.length - 1].kind !== kind) {
      runs.push({ kind, text: safeChar });
    } else {
      runs[runs.length - 1].text += safeChar;
    }
  }

  return runs;
}

/**
 * Activates the appropriate font on jsPDF for measuring or drawing a script run.
 */
function activateRunFont(
  ctx: RenderContext,
  kind: ScriptKind,
  isCode: boolean,
  bold?: boolean,
  italic?: boolean,
  fontSizePt = 10
): void {
  ctx.pdf.setFontSize(fontSizePt);
  if (kind === 'cjk' && ctx.hasCjkFont) {
    ctx.pdf.setFont(CJK_FONT_NAME, 'normal');
  } else if (kind === 'symbol' && ctx.hasSymbolFont) {
    ctx.pdf.setFont(SYMBOL_FONT_NAME, 'normal');
  } else if (isCode) {
    ctx.pdf.setFont('courier', bold ? 'bold' : 'normal');
  } else {
    const style = bold && italic ? 'bolditalic' : bold ? 'bold' : italic ? 'italic' : 'normal';
    ctx.pdf.setFont('helvetica', style);
  }
}

/**
 * Measures the exact horizontal width (in mm) of a styled span.
 */
function measureSpanWidth(ctx: RenderContext, span: InlineSpan, fontSizePt: number): number {
  if (!span.text) return 0;
  const scriptRuns = splitIntoScriptRuns(ctx, span.text);
  let total = 0;
  for (const sr of scriptRuns) {
    activateRunFont(ctx, sr.kind, Boolean(span.code), span.bold, span.italic, fontSizePt);
    total += ctx.pdf.getTextWidth(sr.text);
  }
  if (span.code) {
    total += 1.6; // Horizontal padding around inline code badge
  }
  return total;
}

/**
 * Draws a single styled span at (x, y) and returns its advanced width in mm.
 */
function drawStyledSpan(
  ctx: RenderContext,
  span: InlineSpan,
  x: number,
  y: number,
  fontSizePt: number,
  defaultColor: RGB
): number {
  if (!span.text) return 0;

  const fontSizeMm = fontSizePt * 0.3528;
  const totalWidth = measureSpanWidth(ctx, span, fontSizePt);
  let drawX = x;

  // Determine foreground color
  let fg: RGB = defaultColor;
  if (span.code) {
    fg = { r: 190, g: 18, b: 60 }; // #BE123C rose-700
  } else if (span.linkUrl) {
    fg = { r: 37, g: 99, b: 235 }; // #2563EB blue-600
  }

  // Draw inline code background pill
  if (span.code) {
    ctx.pdf.setFillColor(241, 245, 249); // #F1F5F9 slate-100
    ctx.pdf.setDrawColor(226, 232, 240); // #E2E8F0 slate-200
    ctx.pdf.setLineWidth(0.15);
    ctx.pdf.roundedRect(
      x,
      y - fontSizeMm * 0.82,
      totalWidth,
      fontSizeMm * 1.12,
      0.7,
      0.7,
      'FD'
    );
    drawX += 0.8;
  }

  const scriptRuns = splitIntoScriptRuns(ctx, span.text);
  ctx.pdf.setTextColor(fg.r, fg.g, fg.b);

  for (const sr of scriptRuns) {
    activateRunFont(ctx, sr.kind, Boolean(span.code), span.bold, span.italic, fontSizePt);
    const w = ctx.pdf.getTextWidth(sr.text);

    if (sr.kind !== 'latin' && span.bold) {
      // Simulate bold on single-weight Unicode TTF fonts via fillThenStroke
      ctx.pdf.setDrawColor(fg.r, fg.g, fg.b);
      ctx.pdf.setLineWidth(0.2);
      ctx.pdf.text(sr.text, drawX, y, { renderingMode: 'fillThenStroke' });
    } else {
      ctx.pdf.text(sr.text, drawX, y);
    }

    drawX += w;
  }

  // Draw hyperlink underline and interactive clickable annotation
  if (span.linkUrl) {
    ctx.pdf.setDrawColor(37, 99, 235);
    ctx.pdf.setLineWidth(0.22);
    ctx.pdf.line(x, y + 0.65, x + totalWidth, y + 0.65);
    ctx.pdf.link(x, y - fontSizeMm * 0.88, totalWidth, fontSizeMm * 1.2, {
      url: span.linkUrl,
    });
  }

  // Draw strikethrough line
  if (span.strike) {
    ctx.pdf.setDrawColor(fg.r, fg.g, fg.b);
    ctx.pdf.setLineWidth(0.22);
    ctx.pdf.line(x, y - fontSizeMm * 0.28, x + totalWidth, y - fontSizeMm * 0.28);
  }

  return totalWidth;
}

/**
 * Breaks a single InlineSpan into wrappable atomic spans (individual CJK chars, words, or whitespace)
 * so line wrapping can break cleanly at word or CJK character boundaries.
 */
function tokenizeSpanForWrapping(
  ctx: RenderContext,
  span: InlineSpan,
  fontSizePt: number,
  maxWidth: number
): InlineSpan[] {
  if (span.code) {
    // Keep short inline code spans atomic if they fit on a line
    if (measureSpanWidth(ctx, span, fontSizePt) <= maxWidth) {
      return [span];
    }
  }

  const parts = span.text.match(/(\s+|[\u2E80-\uFFFF]|[^\s\u2E80-\uFFFF]+)/g) || [span.text];
  const atoms: InlineSpan[] = [];

  for (const part of parts) {
    const candidate: InlineSpan = { ...span, text: part };
    if (measureSpanWidth(ctx, candidate, fontSizePt) <= maxWidth || part.length <= 1) {
      atoms.push(candidate);
    } else {
      // Single very long token (e.g. long URL or identifier): split character by character
      let buf = '';
      for (const ch of part) {
        const next = buf + ch;
        if (buf && measureSpanWidth(ctx, { ...span, text: next }, fontSizePt) > maxWidth) {
          atoms.push({ ...span, text: buf });
          buf = ch;
        } else {
          buf = next;
        }
      }
      if (buf) {
        atoms.push({ ...span, text: buf });
      }
    }
  }

  return atoms;
}

/**
 * Merges adjacent atomic spans on the same visual line that share identical styling
 * so text is drawn in clean contiguous runs.
 */
function mergeAdjacentSpans(spans: InlineSpan[]): InlineSpan[] {
  const merged: InlineSpan[] = [];
  for (const sp of spans) {
    const prev = merged[merged.length - 1];
    if (
      prev &&
      !prev.code &&
      !sp.code &&
      prev.bold === sp.bold &&
      prev.italic === sp.italic &&
      prev.strike === sp.strike &&
      prev.linkUrl === sp.linkUrl
    ) {
      prev.text += sp.text;
    } else {
      merged.push({ ...sp });
    }
  }
  return merged;
}

/**
 * Wraps a logical line of InlineSpans into one or more visual lines fitting within maxWidth.
 */
function wrapLogicalLine(
  ctx: RenderContext,
  logicalLine: InlineSpan[],
  fontSizePt: number,
  maxWidth: number
): InlineSpan[][] {
  if (logicalLine.length === 0) return [[]];

  const atoms: InlineSpan[] = [];
  for (const sp of logicalLine) {
    atoms.push(...tokenizeSpanForWrapping(ctx, sp, fontSizePt, maxWidth));
  }

  const visualLines: InlineSpan[][] = [];
  let currentLine: InlineSpan[] = [];
  let currentWidth = 0;

  for (const atom of atoms) {
    const atomWidth = measureSpanWidth(ctx, atom, fontSizePt);
    if (currentLine.length > 0 && currentWidth + atomWidth > maxWidth) {
      visualLines.push(mergeAdjacentSpans(currentLine));
      // Trim pure leading spaces on wrapped continuation lines (while keeping original logical line indents)
      if (/^\s+$/.test(atom.text) && !atom.code) {
        currentLine = [];
        currentWidth = 0;
        continue;
      }
      currentLine = [atom];
      currentWidth = atomWidth;
    } else {
      currentLine.push(atom);
      currentWidth += atomWidth;
    }
  }

  if (currentLine.length > 0 || visualLines.length === 0) {
    visualLines.push(mergeAdjacentSpans(currentLine));
  }

  return visualLines;
}

/**
 * Ensures there is at least `neededHeight` mm remaining on the current page,
 * adding a new page and resetting cursorY if needed.
 */
function ensurePageSpace(ctx: RenderContext, neededHeight: number): void {
  if (ctx.cursorY + neededHeight > ctx.pageHeight - ctx.margin) {
    ctx.pdf.addPage();
    ctx.cursorY = ctx.margin + 4;
  }
}

/**
 * Renders a flow of inline spans (supporting multi-line breaks, wrapping, inline code, links, bold/italic).
 */
function renderInlineFlow(
  ctx: RenderContext,
  spans: InlineSpan[],
  options: {
    startX: number;
    maxWidth: number;
    fontSizePt: number;
    lineHeightMm: number;
    color: RGB;
    onBeforeVisualLine?: (lineY: number, lineHeightMm: number) => void;
  }
): void {
  // Group spans into logical lines separated by explicit line breaks
  const logicalLines: InlineSpan[][] = [[]];
  for (const sp of spans) {
    if (sp.isLineBreak) {
      logicalLines.push([]);
    } else if (sp.text) {
      logicalLines[logicalLines.length - 1].push(sp);
    }
  }

  for (const logicalLine of logicalLines) {
    if (logicalLine.length === 0) {
      ensurePageSpace(ctx, options.lineHeightMm * 0.75);
      options.onBeforeVisualLine?.(ctx.cursorY, options.lineHeightMm * 0.75);
      ctx.cursorY += options.lineHeightMm * 0.75;
      continue;
    }

    const visualLines = wrapLogicalLine(ctx, logicalLine, options.fontSizePt, options.maxWidth);
    for (const vLine of visualLines) {
      ensurePageSpace(ctx, options.lineHeightMm);
      options.onBeforeVisualLine?.(ctx.cursorY, options.lineHeightMm);
      let x = options.startX;
      for (const run of vLine) {
        x += drawStyledSpan(ctx, run, x, ctx.cursorY, options.fontSizePt, options.color);
      }
      ctx.cursorY += options.lineHeightMm;
    }
  }
}

/**
 * Renders a fenced or indented code block with background shading, border, and left accent bar.
 * Automatically splits across page boundaries if the code block is long.
 */
function renderCodeBlock(
  ctx: RenderContext,
  codeText: string,
  leftX = ctx.margin,
  blockWidth = ctx.contentWidth
): void {
  const normalized = normalizeText(codeText.replace(/\n$/, ''));
  const rawLines = normalized.split('\n');
  const fontSizePt = 9;
  const lineHeightMm = 4.5;
  const padX = 3.5;
  const padY = 3;
  const innerWidth = blockWidth - padX * 2;

  // Wrap each code line to fit inside innerWidth
  const wrappedCodeLines: string[] = [];
  for (const rawLine of rawLines) {
    if (!rawLine) {
      wrappedCodeLines.push('');
      continue;
    }
    const lineSpans = tokenizeSpanForWrapping(
      ctx,
      { text: rawLine, code: false },
      fontSizePt,
      innerWidth
    );
    let current = '';
    let currentW = 0;
    for (const atom of lineSpans) {
      const scriptRuns = splitIntoScriptRuns(ctx, atom.text);
      let w = 0;
      for (const sr of scriptRuns) {
        activateRunFont(ctx, sr.kind, true, false, false, fontSizePt);
        w += ctx.pdf.getTextWidth(sr.text);
      }
      if (current && currentW + w > innerWidth) {
        wrappedCodeLines.push(current);
        current = atom.text;
        currentW = w;
      } else {
        current += atom.text;
        currentW += w;
      }
    }
    wrappedCodeLines.push(current);
  }

  let lineIdx = 0;
  ctx.cursorY += 1;

  while (lineIdx < wrappedCodeLines.length) {
    const availableHeight = ctx.pageHeight - ctx.margin - ctx.cursorY;
    const maxLinesThisPage = Math.floor((availableHeight - padY * 2) / lineHeightMm);

    if (maxLinesThisPage < 1) {
      ctx.pdf.addPage();
      ctx.cursorY = ctx.margin + 4;
      continue;
    }

    const chunkLines = wrappedCodeLines.slice(lineIdx, lineIdx + maxLinesThisPage);
    const boxHeight = chunkLines.length * lineHeightMm + padY * 2;
    const boxTop = ctx.cursorY - 3.2;

    // Background & border
    ctx.pdf.setFillColor(248, 250, 252); // #F8FAFC
    ctx.pdf.setDrawColor(226, 232, 240); // #E2E8F0
    ctx.pdf.setLineWidth(0.25);
    ctx.pdf.roundedRect(leftX, boxTop, blockWidth, boxHeight, 1.2, 1.2, 'FD');

    // Left accent bar
    ctx.pdf.setFillColor(148, 163, 184); // #94A3B8
    ctx.pdf.rect(leftX, boxTop, 1.1, boxHeight, 'F');

    let textY = boxTop + padY + 3.0;
    ctx.pdf.setTextColor(30, 41, 59); // #1E293B

    for (const cLine of chunkLines) {
      if (cLine) {
        let drawX = leftX + padX;
        const scriptRuns = splitIntoScriptRuns(ctx, cLine);
        for (const sr of scriptRuns) {
          activateRunFont(ctx, sr.kind, true, false, false, fontSizePt);
          ctx.pdf.text(sr.text, drawX, textY);
          drawX += ctx.pdf.getTextWidth(sr.text);
        }
      }
      textY += lineHeightMm;
    }

    ctx.cursorY = boxTop + boxHeight + 5.5;
    lineIdx += chunkLines.length;
  }
}

/**
 * Extracts inline tokens from a list item while preserving exact continuation-line
 * relative indentation from `item.raw` (preventing Marked from stripping 3 or 7 spaces
 * unevenly across sub-bullets and indented JSON/YAML blocks inside list items).
 */
function extractListItemSpans(item: Tokens.ListItem): InlineSpan[] {
  const hasComplexBlockChild = (item.tokens || []).some(
    (c) =>
      c.type === 'table' ||
      c.type === 'blockquote' ||
      (c.type === 'code' && (c as Tokens.Code).codeBlockStyle !== 'indented')
  );

  if (item.raw && !hasComplexBlockChild) {
    let bodyRaw = item.raw.replace(/\r\n?/g, '\n');
    for (const child of item.tokens || []) {
      if (child.type === 'list' && child.raw) {
        const childRaw = child.raw.replace(/\r\n?/g, '\n');
        const idx = bodyRaw.lastIndexOf(childRaw);
        if (idx !== -1) {
          bodyRaw = bodyRaw.slice(0, idx);
        }
      }
    }
    bodyRaw = bodyRaw.replace(/\n+$/, '');
    const rawLines = bodyRaw.split('\n');
    if (rawLines.length > 0) {
      const baseIndent = (rawLines[0].match(/^[ \t]*/)?.[0] || '').replace(/\t/g, '  ').length;
      rawLines[0] = rawLines[0].replace(/^[ \t]*(?:[-*+]|\d+[.)])[ \t]+(?:\[[ xX]\][ \t]+)?/, '');

      const spans: InlineSpan[] = [];
      rawLines.forEach((rawLine, lineIdx) => {
        if (lineIdx > 0) {
          spans.push({ text: '', isLineBreak: true });
        }
        if (!rawLine.trim()) {
          return;
        }
        if (lineIdx === 0) {
          const inlineToks = Lexer.lexInline(rawLine, { gfm: true, breaks: true });
          spans.push(...flattenInlineTokens(inlineToks));
        } else {
          const expanded = rawLine.replace(/\t/g, '  ');
          const leadingSpaces = expanded.match(/^ */)?.[0].length ?? 0;
          const netIndent = Math.max(0, leadingSpaces - baseIndent);
          const contentPart = expanded.slice(leadingSpaces);
          if (netIndent > 0) {
            spans.push({ text: ' '.repeat(netIndent) });
          }
          if (contentPart) {
            const inlineToks = Lexer.lexInline(contentPart, { gfm: true, breaks: true });
            spans.push(...flattenInlineTokens(inlineToks));
          }
        }
      });

      if (spans.length > 0) {
        return spans;
      }
    }
  }

  const spans: InlineSpan[] = [];
  for (const child of item.tokens || []) {
    if (child.type === 'list') continue;
    if (child.type === 'code' && (child as Tokens.Code).codeBlockStyle !== 'indented') continue;
    if (child.type === 'paragraph') {
      const pTok = child as Tokens.Paragraph;
      if (spans.length > 0) spans.push({ text: '', isLineBreak: true });
      spans.push(...flattenInlineTokens(pTok.tokens || []));
    } else if (child.type === 'text') {
      const tTok = child as Tokens.Text;
      if (tTok.tokens && tTok.tokens.length > 0) {
        spans.push(...flattenInlineTokens(tTok.tokens));
      } else {
        pushTextWithNewlines(spans, tTok.text || '', {});
      }
    } else if (child.type === 'code') {
      const cTok = child as Tokens.Code;
      if (spans.length > 0) spans.push({ text: '', isLineBreak: true });
      pushTextWithNewlines(spans, cTok.text || '', { code: true });
    } else {
      spans.push(...flattenInlineTokens([child]));
    }
  }
  if (spans.length === 0 && item.text) {
    pushTextWithNewlines(spans, item.text, {});
  }
  return spans;
}

/**
 * Renders ordered and unordered lists with multi-level nesting.
 */
function renderList(ctx: RenderContext, listTok: Tokens.List, level = 0): void {
  const indentMm = level * 5.5;
  const markerWidthMm = 5;
  const itemStartX = ctx.margin + indentMm + markerWidthMm;
  const itemMaxWidth = Math.max(40, ctx.contentWidth - indentMm - markerWidthMm);
  const fontSizePt = 10;
  const lineHeightMm = 5.2;
  const startNum = typeof listTok.start === 'number' ? listTok.start : 1;

  listTok.items.forEach((item, idx) => {
    ensurePageSpace(ctx, lineHeightMm);

    // Draw list marker (number or vector bullet)
    const markerX = ctx.margin + indentMm;
    if (listTok.ordered) {
      activateRunFont(ctx, 'latin', false, true, false, fontSizePt);
      ctx.pdf.setTextColor(51, 65, 85);
      ctx.pdf.text(`${startNum + idx}.`, markerX, ctx.cursorY);
    } else {
      ctx.pdf.setFillColor(71, 85, 105);
      ctx.pdf.circle(markerX + 1.5, ctx.cursorY - 1.2, level === 0 ? 0.65 : 0.5, 'F');
    }

    const itemSpans = extractListItemSpans(item);
    renderInlineFlow(ctx, itemSpans, {
      startX: itemStartX,
      maxWidth: itemMaxWidth,
      fontSizePt,
      lineHeightMm,
      color: { r: 30, g: 41, b: 59 },
    });

    // Render fenced code blocks or nested sublists if present
    for (const child of item.tokens || []) {
      if (child.type === 'code' && (child as Tokens.Code).codeBlockStyle !== 'indented') {
        renderCodeBlock(ctx, (child as Tokens.Code).text || '', itemStartX, itemMaxWidth);
      } else if (child.type === 'list') {
        renderList(ctx, child as Tokens.List, level + 1);
      }
    }
  });

  if (level === 0) {
    ctx.cursorY += 1.5;
  }
}

/**
 * Renders a Markdown table with header background, cell borders, zebra striping, and wrapped cell content.
 */
function renderTable(ctx: RenderContext, tableTok: Tokens.Table): void {
  const numCols = Math.max(1, tableTok.header.length);
  const colWidth = ctx.contentWidth / numCols;
  const cellPadX = 2.5;
  const cellPadY = 2.2;
  const innerColWidth = Math.max(12, colWidth - cellPadX * 2);
  const fontSizePt = 9.5;
  const lineHeightMm = 4.6;

  const drawTableRow = (
    cells: Tokens.TableCell[],
    isHeader: boolean,
    rowIndex: number
  ) => {
    const wrappedCells: InlineSpan[][][] = cells.map((cell) => {
      const spans = flattenInlineTokens(
        cell.tokens || [{ type: 'text', raw: cell.text, text: cell.text } as Token],
        { bold: isHeader }
      );
      return wrapLogicalLine(ctx, spans, fontSizePt, innerColWidth);
    });

    const maxVisualLines = Math.max(1, ...wrappedCells.map((c) => c.length));
    const rowHeight = maxVisualLines * lineHeightMm + cellPadY * 2;

    ensurePageSpace(ctx, rowHeight + 2);
    const rowTop = ctx.cursorY - 3.2;

    // Draw row background and cell borders
    for (let c = 0; c < numCols; c++) {
      const cellX = ctx.margin + c * colWidth;
      if (isHeader) {
        ctx.pdf.setFillColor(241, 245, 249); // #F1F5F9
        ctx.pdf.setDrawColor(203, 213, 225); // #CBD5E1
        ctx.pdf.setLineWidth(0.25);
        ctx.pdf.rect(cellX, rowTop, colWidth, rowHeight, 'FD');
      } else {
        if (rowIndex % 2 === 1) {
          ctx.pdf.setFillColor(248, 250, 252); // #F8FAFC
          ctx.pdf.setDrawColor(226, 232, 240); // #E2E8F0
          ctx.pdf.setLineWidth(0.2);
          ctx.pdf.rect(cellX, rowTop, colWidth, rowHeight, 'FD');
        } else {
          ctx.pdf.setDrawColor(226, 232, 240); // #E2E8F0
          ctx.pdf.setLineWidth(0.2);
          ctx.pdf.rect(cellX, rowTop, colWidth, rowHeight, 'S');
        }
      }

      const vLines = wrappedCells[c] || [];
      let lineY = rowTop + cellPadY + 3.2;
      for (const vLine of vLines) {
        let x = cellX + cellPadX;
        for (const run of vLine) {
          x += drawStyledSpan(
            ctx,
            run,
            x,
            lineY,
            fontSizePt,
            isHeader ? { r: 15, g: 23, b: 42 } : { r: 30, g: 41, b: 59 }
          );
        }
        lineY += lineHeightMm;
      }
    }

    ctx.cursorY = rowTop + rowHeight + 3.2;
  };

  ctx.cursorY += 1;
  drawTableRow(tableTok.header, true, 0);
  tableTok.rows.forEach((row, rIdx) => {
    drawTableRow(row, false, rIdx);
  });
  ctx.cursorY += 2.5;
}

/**
 * Converts a Markdown string into a true vector PDF Blob with selectable/editable text,
 * active clickable hyperlinks, full Markdown styling, and embedded subsetted CJK typography.
 */
export async function convertMarkdownToPdfBlob(
  markdown: string,
  documentTitle?: string
): Promise<Blob> {
  const pdf = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
    compress: true,
  });

  // Load and register CJK and Symbol Unicode fonts as needed
  let hasCjkFont = false;
  let cjkGlyphCheck: ((code: number) => boolean) | null = null;
  let hasSymbolFont = false;
  let symbolGlyphCheck: ((code: number) => boolean) | null = null;

  if (hasNonAscii(markdown) || hasNonAscii(documentTitle)) {
    const combinedNormalized = normalizeText(`${documentTitle || ''}\n${markdown || ''}`);
    let needsCjk = false;
    let needsSymbol = false;

    for (let i = 0; i < combinedNormalized.length; i++) {
      const code = combinedNormalized.charCodeAt(i);
      if (code > 0x007e) {
        if (isCjkCodePoint(code)) {
          needsCjk = true;
        } else {
          needsSymbol = true;
        }
      }
    }

    const [cjkBase64, symbolBase64] = await Promise.all([
      needsCjk ? loadCjkFontBase64() : Promise.resolve(null),
      needsSymbol ? loadSymbolFontBase64() : Promise.resolve(null),
    ]);

    if (cjkBase64) {
      pdf.addFileToVFS(CJK_FONT_VFS_NAME, cjkBase64);
      pdf.addFont(CJK_FONT_VFS_NAME, CJK_FONT_NAME, 'normal', 'Identity-H');
      pdf.setFont(CJK_FONT_NAME, 'normal');
      const fontObj = pdf.getFont() as {
        metadata?: { characterToGlyph?: (code: number) => number };
      };
      if (fontObj?.metadata?.characterToGlyph) {
        hasCjkFont = true;
        const meta = fontObj.metadata;
        cjkGlyphCheck = (code: number) => Number(meta.characterToGlyph?.(code)) > 0;
      }
    }

    if (symbolBase64) {
      pdf.addFileToVFS(SYMBOL_FONT_VFS_NAME, symbolBase64);
      pdf.addFont(SYMBOL_FONT_VFS_NAME, SYMBOL_FONT_NAME, 'normal', 'Identity-H');
      pdf.setFont(SYMBOL_FONT_NAME, 'normal');
      const fontObj = pdf.getFont() as {
        metadata?: { characterToGlyph?: (code: number) => number };
      };
      if (fontObj?.metadata?.characterToGlyph) {
        hasSymbolFont = true;
        const meta = fontObj.metadata;
        symbolGlyphCheck = (code: number) => Number(meta.characterToGlyph?.(code)) > 0;
      }
    }
  }

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  const ctx: RenderContext = {
    pdf,
    hasCjkFont,
    cjkGlyphCheck,
    hasSymbolFont,
    symbolGlyphCheck,
    pageWidth,
    pageHeight,
    margin,
    contentWidth,
    cursorY: margin + 5,
  };

  // Render document title header if markdown doesn't already begin with an H1
  if (documentTitle && !markdown.trim().startsWith('# ')) {
    const titleSpans: InlineSpan[] = [];
    pushTextWithNewlines(titleSpans, documentTitle, { bold: true });
    renderInlineFlow(ctx, titleSpans, {
      startX: margin,
      maxWidth: contentWidth,
      fontSizePt: 18,
      lineHeightMm: 7.5,
      color: { r: 15, g: 23, b: 42 },
    });
    ctx.pdf.setDrawColor(226, 232, 240);
    ctx.pdf.setLineWidth(0.35);
    ctx.pdf.line(margin, ctx.cursorY - 3.5, pageWidth - margin, ctx.cursorY - 3.5);
    ctx.cursorY += 4;
  }

  const marked = new Marked({
    gfm: true,
    breaks: true,
  });
  const tokens = marked.lexer(markdown || '');

  for (const token of tokens) {
    switch (token.type) {
      case 'heading': {
        const hTok = token as Tokens.Heading;
        const depth = hTok.depth;
        const fontSizePt =
          depth === 1
            ? 16
            : depth === 2
            ? 13.5
            : depth === 3
            ? 11.5
            : depth === 4
            ? 10.5
            : 10;
        const lineHeightMm =
          depth === 1 ? 7 : depth === 2 ? 6.2 : depth === 3 ? 5.6 : 5.2;

        ctx.cursorY += depth <= 2 ? 2.5 : 1.5;
        ensurePageSpace(ctx, lineHeightMm + 3);

        const spans = flattenInlineTokens(
          hTok.tokens || [{ type: 'text', raw: hTok.text, text: hTok.text } as Token],
          { bold: true }
        );
        renderInlineFlow(ctx, spans, {
          startX: margin,
          maxWidth: contentWidth,
          fontSizePt,
          lineHeightMm,
          color: { r: 15, g: 23, b: 42 },
        });

        if (depth <= 2) {
          ctx.pdf.setDrawColor(depth === 1 ? 226 : 241, depth === 1 ? 232 : 245, depth === 1 ? 240 : 249);
          ctx.pdf.setLineWidth(0.25);
          ctx.pdf.line(margin, ctx.cursorY - 3.2, pageWidth - margin, ctx.cursorY - 3.2);
          ctx.cursorY += 2;
        } else {
          ctx.cursorY += 1;
        }
        break;
      }

      case 'paragraph': {
        const pTok = token as Tokens.Paragraph;
        const spans = flattenInlineTokens(
          pTok.tokens || [{ type: 'text', raw: pTok.text, text: pTok.text } as Token]
        );
        renderInlineFlow(ctx, spans, {
          startX: margin,
          maxWidth: contentWidth,
          fontSizePt: 10,
          lineHeightMm: 5.2,
          color: { r: 30, g: 41, b: 59 },
        });
        ctx.cursorY += 2.2;
        break;
      }

      case 'code': {
        const codeTok = token as Tokens.Code;
        renderCodeBlock(ctx, codeTok.text || '');
        break;
      }

      case 'blockquote': {
        const bqTok = token as Tokens.Blockquote;
        const bqSpans: InlineSpan[] = [];
        for (const child of bqTok.tokens || []) {
          if (bqSpans.length > 0) {
            bqSpans.push({ text: '', isLineBreak: true });
          }
          if (child.type === 'paragraph') {
            const p = child as Tokens.Paragraph;
            bqSpans.push(...flattenInlineTokens(p.tokens || [], { italic: true }));
          } else {
            bqSpans.push(...flattenInlineTokens([child], { italic: true }));
          }
        }
        renderInlineFlow(ctx, bqSpans, {
          startX: margin + 4.5,
          maxWidth: contentWidth - 4.5,
          fontSizePt: 10,
          lineHeightMm: 5.2,
          color: { r: 71, g: 85, b: 105 },
          onBeforeVisualLine: (lineY, lh) => {
            ctx.pdf.setFillColor(203, 213, 225); // #CBD5E1
            ctx.pdf.rect(margin, lineY - 3.8, 1.0, lh + 0.4, 'F');
          },
        });
        ctx.cursorY += 2.2;
        break;
      }

      case 'list': {
        renderList(ctx, token as Tokens.List, 0);
        break;
      }

      case 'table': {
        renderTable(ctx, token as Tokens.Table);
        break;
      }

      case 'hr': {
        ensurePageSpace(ctx, 6);
        ctx.cursorY += 1;
        ctx.pdf.setDrawColor(226, 232, 240);
        ctx.pdf.setLineWidth(0.3);
        ctx.pdf.line(margin, ctx.cursorY, pageWidth - margin, ctx.cursorY);
        ctx.cursorY += 5;
        break;
      }

      case 'space': {
        ctx.cursorY += 1;
        break;
      }

      default:
        break;
    }
  }

  return pdf.output('blob');
}
