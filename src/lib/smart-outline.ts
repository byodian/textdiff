/**
 * Zero-Config Smart Outline & Semantic Segment Parser
 *
 * Automatically segments release scripts, SQL files, Markdown docs, YAML/JSON configs,
 * and plaintext documents into navigable, foldable, and copyable semantic blocks
 * without requiring manual headings or comments.
 *
 * @author BAI YONGJIAN
 */

export type OutlineCategory = 'ddl' | 'dml' | 'config' | 'doc';

export type OutlineBadgeType =
  | 'CREATE'
  | 'ALTER'
  | 'DROP'
  | 'INSERT'
  | 'UPDATE'
  | 'DELETE'
  | 'SQL'
  | 'YAML'
  | 'JSON'
  | 'HEADING'
  | 'LINK'
  | 'TEXT';

export interface OutlineSegment {
  id: string;
  /** Primary display label, e.g. table name `base_resource`, heading title, or key name */
  title: string;
  /** Extracted business keywords or summary preview, e.g. `AI诊断分析 · 节能诊断报告 · 节能报告模板配置` */
  subtitle: string;
  /** Badge type for visual categorization */
  badge: OutlineBadgeType;
  /** Optional count of statements in this contiguous block (e.g. 73 for 73 INSERT rows) */
  count?: number;
  /** Broad category for quick filtering */
  category: OutlineCategory;
  /** 1-based inclusive start line in the document */
  startLine: number;
  /** 1-based inclusive end line in the document */
  endLine: number;
  /** Indentation/nesting level (0 = top-level, 1 = inside heading/section) */
  level: number;
  /** Raw text content of this segment (for one-click copy and search matching) */
  rawText: string;
}

const GENERIC_SQL_COMMENTS = new Set([
  '主键',
  '创建时间',
  '创建人',
  '更新时间',
  '更新人',
  '修改时间',
  '修改人',
  '删除标识',
  '是否删除',
  '租户ID',
  '租户id',
  '备注',
]);

const BOILERPLATE_COMMENT_PATTERNS = [
  /Navicat\s+Premium/i,
  /Source\s+Server/i,
  /Target\s+Server/i,
  /File\s+Encoding/i,
  /Date:\s*\d/i,
  /^[-=\s*]+$/,
  /^Table\s+structure\s+for\b/i,
  /^Records\s+of\b/i,
];

/**
 * Extracts meaningful Chinese business terms or string literals from SQL statements.
 */
export function extractSqlBusinessKeywords(sqlText: string, maxKeywords = 5): string[] {
  const keywords: string[] = [];
  const seen = new Set<string>();

  const addKeyword = (raw: string, allowGeneric = false) => {
    const cleaned = raw
      .replace(/\\["']/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cleaned || cleaned.length > 32) return;
    // Must contain at least one CJK character to qualify as a business label
    if (!/[\u4e00-\u9fa5]/.test(cleaned)) return;
    // Strip trailing punctuation explanations like "删除标识；0：未删除；1：删除；"
    const shortLabel = cleaned.split(/[；;：:（(，,]/)[0].trim();
    if (!shortLabel) return;
    if (!allowGeneric && GENERIC_SQL_COMMENTS.has(shortLabel)) return;
    if (!seen.has(shortLabel)) {
      seen.add(shortLabel);
      keywords.push(shortLabel);
    }
  };

  // 1. Check inline -- comments that aren't boilerplate
  const lineCommentRegex = /--\s*([^\r\n]+)/g;
  let match: RegExpExecArray | null;
  while ((match = lineCommentRegex.exec(sqlText)) !== null) {
    const commentBody = match[1].trim();
    if (!BOILERPLATE_COMMENT_PATTERNS.some((p) => p.test(commentBody))) {
      addKeyword(commentBody);
    }
  }

  // 2. Extract single-quoted literals containing Chinese characters (e.g. VALUES (..., 'AI诊断分析', ...))
  const quotedRegex = /'([^'\\\r\n]{1,40})'/g;
  while ((match = quotedRegex.exec(sqlText)) !== null) {
    addKeyword(match[1]);
    if (keywords.length >= maxKeywords) break;
  }

  // 3. If still empty (e.g. CREATE TABLE with only generic column comments), allow generic column comments as fallback
  if (keywords.length === 0) {
    quotedRegex.lastIndex = 0;
    while ((match = quotedRegex.exec(sqlText)) !== null) {
      addKeyword(match[1], true);
      if (keywords.length >= maxKeywords) break;
    }
  }

  return keywords.slice(0, maxKeywords);
}

/**
 * Parses a range of lines (1-based offset `baseLineOffset`) as SQL and returns OutlineSegments.
 * Respects blank lines as segment boundaries between consecutive DML statements.
 */
function parseSqlRange(
  lines: string[],
  baseLineOffset: number,
  level = 0
): OutlineSegment[] {
  const segments: OutlineSegment[] = [];
  let i = 0;
  const n = lines.length;

  const getSliceText = (startIdx: number, endIdx: number) =>
    lines.slice(startIdx, endIdx + 1).join('\n');

  while (i < n) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Skip blank lines or pure boilerplate SET statements
    if (
      !trimmed ||
      /^SET\s+(NAMES|FOREIGN_KEY_CHECKS)\b/i.test(trimmed)
    ) {
      i++;
      continue;
    }

    // Skip multi-line /* ... */ comments if they are Navicat boilerplate
    if (trimmed.startsWith('/*')) {
      const commentStart = i;
      while (i < n && !lines[i].includes('*/')) {
        i++;
      }
      const commentEnd = Math.min(i, n - 1);
      const commentText = getSliceText(commentStart, commentEnd);
      const isBoilerplate = BOILERPLATE_COMMENT_PATTERNS.some((p) => p.test(commentText));
      i = commentEnd + 1;
      if (isBoilerplate) {
        continue;
      }
      continue;
    }

    // Skip standalone boilerplate `-- ---` lines
    if (trimmed.startsWith('--')) {
      const commentBody = trimmed.replace(/^--+\s*/, '').trim();
      if (BOILERPLATE_COMMENT_PATTERNS.some((p) => p.test(commentBody))) {
        i++;
        continue;
      }
    }

    // Check for DROP TABLE IF EXISTS followed immediately by CREATE TABLE
    const dropMatch = trimmed.match(/^DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?[`"']?([\w.]+)[`"']?/i);
    if (dropMatch) {
      const dropStart = i;
      const dropTable = dropMatch[1];
      let nextIdx = i + 1;
      while (nextIdx < n && !lines[nextIdx].trim()) {
        nextIdx++;
      }
      if (nextIdx < n) {
        const nextTrimmed = lines[nextIdx].trim();
        const createMatch = nextTrimmed.match(
          /^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?([\w.]+)[`"']?/i
        );
        if (createMatch && createMatch[1].toLowerCase() === dropTable.toLowerCase()) {
          // Consume until end of CREATE TABLE statement (`;` at end of line)
          let endIdx = nextIdx;
          while (endIdx < n && !lines[endIdx].trim().endsWith(';')) {
            endIdx++;
          }
          if (endIdx >= n) endIdx = n - 1;
          const rawText = getSliceText(dropStart, endIdx);
          const keywords = extractSqlBusinessKeywords(rawText);
          segments.push({
            id: `sql-create-${baseLineOffset + dropStart}-${dropTable}`,
            title: dropTable,
            subtitle: keywords.length > 0 ? keywords.join(' · ') : '建表语句 (DROP & CREATE)',
            badge: 'CREATE',
            category: 'ddl',
            startLine: baseLineOffset + dropStart,
            endLine: baseLineOffset + endIdx,
            level,
            rawText,
          });
          i = endIdx + 1;
          continue;
        }
      }

      // Standalone DROP TABLE
      const rawText = getSliceText(dropStart, dropStart);
      segments.push({
        id: `sql-drop-${baseLineOffset + dropStart}-${dropTable}`,
        title: dropTable,
        subtitle: '删除表 (DROP TABLE)',
        badge: 'DROP',
        category: 'ddl',
        startLine: baseLineOffset + dropStart,
        endLine: baseLineOffset + dropStart,
        level,
        rawText,
      });
      i++;
      continue;
    }

    // Check for CREATE TABLE
    const createMatch = trimmed.match(
      /^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?([\w.]+)[`"']?/i
    );
    if (createMatch) {
      const startIdx = i;
      const tableName = createMatch[1];
      let endIdx = i;
      while (endIdx < n && !lines[endIdx].trim().endsWith(';')) {
        endIdx++;
      }
      if (endIdx >= n) endIdx = n - 1;
      const rawText = getSliceText(startIdx, endIdx);
      const keywords = extractSqlBusinessKeywords(rawText);
      segments.push({
        id: `sql-create-${baseLineOffset + startIdx}-${tableName}`,
        title: tableName,
        subtitle: keywords.length > 0 ? keywords.join(' · ') : '建表语句 (CREATE TABLE)',
        badge: 'CREATE',
        category: 'ddl',
        startLine: baseLineOffset + startIdx,
        endLine: baseLineOffset + endIdx,
        level,
        rawText,
      });
      i = endIdx + 1;
      continue;
    }

    // Check for ALTER TABLE
    const alterMatch = trimmed.match(/^ALTER\s+TABLE\s+[`"']?([\w.]+)[`"']?/i);
    if (alterMatch) {
      const startIdx = i;
      const tableName = alterMatch[1];
      let endIdx = i;
      let count = 1;
      while (endIdx < n && !lines[endIdx].trim().endsWith(';')) {
        endIdx++;
      }
      if (endIdx >= n) endIdx = n - 1;

      // Group consecutive ALTER TABLE on the same table if no blank line
      while (endIdx + 1 < n) {
        const peekTrimmed = lines[endIdx + 1].trim();
        if (!peekTrimmed) break; // Blank line boundary!
        const nextAlter = peekTrimmed.match(/^ALTER\s+TABLE\s+[`"']?([\w.]+)[`"']?/i);
        if (nextAlter && nextAlter[1].toLowerCase() === tableName.toLowerCase()) {
          endIdx++;
          count++;
          while (endIdx < n && !lines[endIdx].trim().endsWith(';')) {
            endIdx++;
          }
          if (endIdx >= n) endIdx = n - 1;
        } else {
          break;
        }
      }

      const rawText = getSliceText(startIdx, endIdx);
      const keywords = extractSqlBusinessKeywords(rawText);
      segments.push({
        id: `sql-alter-${baseLineOffset + startIdx}-${tableName}`,
        title: tableName,
        subtitle: keywords.length > 0 ? keywords.join(' · ') : '表结构变更 (ALTER TABLE)',
        badge: 'ALTER',
        count: count > 1 ? count : undefined,
        category: 'ddl',
        startLine: baseLineOffset + startIdx,
        endLine: baseLineOffset + endIdx,
        level,
        rawText,
      });
      i = endIdx + 1;
      continue;
    }

    // Check for DML: INSERT INTO / REPLACE INTO / UPDATE / DELETE FROM
    const dmlMatch = matchDmlLine(trimmed);
    if (dmlMatch) {
      const startIdx = i;
      const { op, table } = dmlMatch;
      let endIdx = i;
      let count = 1;

      // Advance to end of first statement
      while (endIdx < n && !lines[endIdx].trim().endsWith(';')) {
        if (!lines[endIdx].trim()) break;
        endIdx++;
      }
      if (endIdx >= n) endIdx = n - 1;

      // Group consecutive same-op + same-table statements ONLY if there is NO blank line between them
      while (endIdx + 1 < n) {
        const nextLineTrimmed = lines[endIdx + 1].trim();
        if (!nextLineTrimmed) {
          // Blank line boundary -> stop grouping!
          break;
        }
        const nextDml = matchDmlLine(nextLineTrimmed);
        if (
          nextDml &&
          nextDml.op === op &&
          nextDml.table.toLowerCase() === table.toLowerCase()
        ) {
          endIdx++;
          count++;
          while (endIdx < n && !lines[endIdx].trim().endsWith(';')) {
            if (!lines[endIdx].trim()) break;
            endIdx++;
          }
          if (endIdx >= n) endIdx = n - 1;
        } else {
          break;
        }
      }

      const rawText = getSliceText(startIdx, endIdx);
      const keywords = extractSqlBusinessKeywords(rawText);
      segments.push({
        id: `sql-dml-${baseLineOffset + startIdx}-${op}-${table}`,
        title: table,
        subtitle:
          keywords.length > 0
            ? keywords.join(' · ')
            : `${op} ${table} (${count} 条语句)`,
        badge: op,
        count,
        category: 'dml',
        startLine: baseLineOffset + startIdx,
        endLine: baseLineOffset + endIdx,
        level,
        rawText,
      });
      i = endIdx + 1;
      continue;
    }

    // Fallback for other non-empty contiguous SQL/comment blocks separated by blank lines
    const startIdx = i;
    let endIdx = i;
    while (endIdx + 1 < n && lines[endIdx + 1].trim() !== '') {
      // Stop if next line starts a recognizable DDL/DML statement
      const nextTrim = lines[endIdx + 1].trim();
      if (
        /^(CREATE|ALTER|DROP)\s+TABLE\b/i.test(nextTrim) ||
        matchDmlLine(nextTrim) !== null
      ) {
        break;
      }
      endIdx++;
    }
    const rawText = getSliceText(startIdx, endIdx);
    const cleanedFirstLine = trimmed.replace(/^--+\s*/, '').trim();
    const keywords = extractSqlBusinessKeywords(rawText);
    segments.push({
      id: `sql-block-${baseLineOffset + startIdx}`,
      title: cleanedFirstLine.slice(0, 40) || `SQL 片段 (L${baseLineOffset + startIdx})`,
      subtitle: keywords.length > 0 ? keywords.join(' · ') : `L${baseLineOffset + startIdx}–L${baseLineOffset + endIdx}`,
      badge: 'SQL',
      category: 'dml',
      startLine: baseLineOffset + startIdx,
      endLine: baseLineOffset + endIdx,
      level,
      rawText,
    });
    i = endIdx + 1;
  }

  return segments;
}

function matchDmlLine(
  trimmedLine: string
): { op: 'INSERT' | 'UPDATE' | 'DELETE'; table: string } | null {
  const insertMatch = trimmedLine.match(
    /^(?:INSERT|REPLACE)\s+(?:IGNORE\s+)?INTO\s+[`"']?([\w.]+)[`"']?/i
  );
  if (insertMatch) {
    return { op: 'INSERT', table: insertMatch[1] };
  }
  const updateMatch = trimmedLine.match(/^UPDATE\s+[`"']?([\w.]+)[`"']?/i);
  if (updateMatch) {
    return { op: 'UPDATE', table: updateMatch[1] };
  }
  const deleteMatch = trimmedLine.match(/^DELETE\s+FROM\s+[`"']?([\w.]+)[`"']?/i);
  if (deleteMatch) {
    return { op: 'DELETE', table: deleteMatch[1] };
  }
  return null;
}

/**
 * Checks whether a single line looks like the start of a SQL DDL/DML statement.
 */
function isLikelySqlStatementLine(trimmedLine: string): boolean {
  return (
    /^(CREATE|ALTER|DROP)\s+TABLE\b/i.test(trimmedLine) ||
    matchDmlLine(trimmedLine) !== null
  );
}

/**
 * Parses Markdown documents (including mixed headings, fenced SQL/YAML blocks,
 * unfenced SQL blocks, and service URL / text paragraphs).
 */
function parseMarkdownOutline(lines: string[]): OutlineSegment[] {
  const segments: OutlineSegment[] = [];
  let i = 0;
  const n = lines.length;
  let currentHeadingLevel = 0;

  const getSliceText = (startIdx: number, endIdx: number) =>
    lines.slice(startIdx, endIdx + 1).join('\n');

  while (i < n) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // 1. Markdown Heading (# ~ ######)
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const hashes = headingMatch[1].length;
      const headingTitle = headingMatch[2].trim();
      currentHeadingLevel = 1;
      segments.push({
        id: `md-heading-${i + 1}`,
        title: headingTitle,
        subtitle: `章节标题 (H${hashes})`,
        badge: 'HEADING',
        category: 'doc',
        startLine: i + 1,
        endLine: i + 1,
        level: 0,
        rawText: rawLine,
      });
      i++;
      continue;
    }

    // 2. Fenced Code Block (```sql, ```yaml, etc.)
    const fenceMatch = trimmed.match(/^(`{3,}|~{3,})\s*([\w-]*)/);
    if (fenceMatch) {
      const fenceChars = fenceMatch[1];
      const fenceLang = (fenceMatch[2] || '').toLowerCase();
      const fenceStartIdx = i;
      i++;
      const innerStartIdx = i;
      while (i < n && !lines[i].trim().startsWith(fenceChars)) {
        i++;
      }
      const innerEndIdx = i - 1;
      const fenceEndIdx = Math.min(i, n - 1);
      i = fenceEndIdx + 1;

      const innerLines = innerStartIdx <= innerEndIdx ? lines.slice(innerStartIdx, innerEndIdx + 1) : [];
      const innerText = innerLines.join('\n');

      // If it's a SQL code block (or contains SQL statements), penetrate it!
      if (
        fenceLang === 'sql' ||
        fenceLang === 'mysql' ||
        innerLines.some((l) => isLikelySqlStatementLine(l.trim()))
      ) {
        const sqlSegments = parseSqlRange(
          innerLines,
          innerStartIdx + 1,
          currentHeadingLevel
        );
        if (sqlSegments.length > 0) {
          segments.push(...sqlSegments);
          continue;
        }
      }

      // If YAML or other code block
      const blockBadge: OutlineBadgeType =
        fenceLang === 'yaml' || fenceLang === 'yml'
          ? 'YAML'
          : fenceLang === 'json'
          ? 'JSON'
          : fenceLang === 'sql'
          ? 'SQL'
          : 'TEXT';
      const firstMeaningfulLine =
        innerLines.find((l) => l.trim() && !l.trim().startsWith('#'))?.trim() ||
        `${fenceLang || '代码'} 块`;
      segments.push({
        id: `md-fence-${fenceStartIdx + 1}`,
        title: firstMeaningfulLine.replace(/:\s*$/, ''),
        subtitle: `${(fenceLang || 'CODE').toUpperCase()} 代码块 (${innerLines.length} 行)`,
        badge: blockBadge,
        category: blockBadge === 'YAML' || blockBadge === 'JSON' ? 'config' : 'doc',
        startLine: fenceStartIdx + 1,
        endLine: fenceEndIdx + 1,
        level: currentHeadingLevel,
        rawText: innerText || getSliceText(fenceStartIdx, fenceEndIdx),
      });
      continue;
    }

    // 3. Unfenced SQL statements pasted directly inside a Markdown file
    if (isLikelySqlStatementLine(trimmed)) {
      const sqlStartIdx = i;
      let sqlEndIdx = i;
      while (sqlEndIdx + 1 < n) {
        const nextTrim = lines[sqlEndIdx + 1].trim();
        if (!nextTrim) break;
        if (nextTrim.startsWith('#') || nextTrim.startsWith('```')) break;
        sqlEndIdx++;
      }
      const subLines = lines.slice(sqlStartIdx, sqlEndIdx + 1);
      const sqlSegs = parseSqlRange(subLines, sqlStartIdx + 1, currentHeadingLevel);
      segments.push(...sqlSegs);
      i = sqlEndIdx + 1;
      continue;
    }

    // 4. Contiguous text / service URL paragraph (separated by blank lines)
    const paraStartIdx = i;
    let paraEndIdx = i;
    while (paraEndIdx + 1 < n) {
      const nextTrim = lines[paraEndIdx + 1].trim();
      if (
        !nextTrim ||
        /^#{1,6}\s+/.test(nextTrim) ||
        /^(`{3,}|~{3,})/.test(nextTrim) ||
        isLikelySqlStatementLine(nextTrim)
      ) {
        break;
      }
      paraEndIdx++;
    }

    const paraLines = lines.slice(paraStartIdx, paraEndIdx + 1);
    const rawText = paraLines.join('\n');
    const hasUrl = paraLines.some((l) => /https?:\/\//i.test(l));
    const firstLine = paraLines[0].trim().replace(/[：:]$/, '');
    const secondLine = paraLines[1]?.trim() || '';

    segments.push({
      id: `md-para-${paraStartIdx + 1}`,
      title: firstLine.slice(0, 42),
      subtitle: hasUrl
        ? secondLine.slice(0, 60) || '服务与分支链接'
        : paraLines.length > 1
        ? paraLines
            .slice(1, 4)
            .map((l) => l.trim())
            .filter(Boolean)
            .join(' · ')
            .slice(0, 50)
        : `文本段落 (L${paraStartIdx + 1})`,
      badge: hasUrl ? 'LINK' : 'TEXT',
      category: hasUrl ? 'config' : 'doc',
      startLine: paraStartIdx + 1,
      endLine: paraEndIdx + 1,
      level: currentHeadingLevel,
      rawText,
    });

    i = paraEndIdx + 1;
  }

  return segments;
}

/**
 * Parses YAML configuration files into top-level / structural key blocks.
 */
function parseYamlOutline(lines: string[]): OutlineSegment[] {
  const segments: OutlineSegment[] = [];
  const n = lines.length;

  // Find key lines at indentation 0 (or 2 if there's only 1 root key)
  const collectAtIndent = (targetIndent: number): { lineIdx: number; key: string }[] => {
    const items: { lineIdx: number; key: string }[] = [];
    for (let i = 0; i < n; i++) {
      const line = lines[i];
      const match = line.match(/^(\s*)([^\s#:-][^:]*):\s*(.*)$/);
      if (match && match[1].length === targetIndent) {
        items.push({ lineIdx: i, key: match[2].trim().replace(/^["']|["']$/g, '') });
      }
    }
    return items;
  };

  let keyItems = collectAtIndent(0);
  if (keyItems.length === 1 && n > 5) {
    const subItems = collectAtIndent(2);
    if (subItems.length >= 1) {
      keyItems = [keyItems[0], ...subItems];
    }
  }

  if (keyItems.length > 0) {
    for (let idx = 0; idx < keyItems.length; idx++) {
      const current = keyItems[idx];
      const startIdx = current.lineIdx;
      const nextLineIdx = idx + 1 < keyItems.length ? keyItems[idx + 1].lineIdx - 1 : n - 1;
      let endIdx = nextLineIdx;
      while (endIdx > startIdx && !lines[endIdx].trim()) {
        endIdx--;
      }
      const sliceLines = lines.slice(startIdx, endIdx + 1);
      const rawText = sliceLines.join('\n');
      const childPreview = sliceLines
        .slice(1, 5)
        .map((l) => l.trim().replace(/^-\s*/, ''))
        .filter((l) => l && !l.startsWith('#'))
        .join(' · ')
        .slice(0, 50);

      segments.push({
        id: `yaml-${startIdx + 1}-${current.key}`,
        title: current.key,
        subtitle: childPreview || `YAML 配置 (${sliceLines.length} 行)`,
        badge: 'YAML',
        category: 'config',
        startLine: startIdx + 1,
        endLine: endIdx + 1,
        level: lines[startIdx].startsWith('  ') ? 1 : 0,
        rawText,
      });
    }
    return segments;
  }

  return parseBlankLineParagraphs(lines, 'YAML', 'config');
}

/**
 * Parses JSON documents into top-level keys or array item blocks.
 */
function parseJsonOutline(lines: string[]): OutlineSegment[] {
  const segments: OutlineSegment[] = [];
  const n = lines.length;
  const keyMatches: { lineIdx: number; key: string; preview: string }[] = [];

  for (let i = 0; i < n; i++) {
    const match = lines[i].match(/^(\s{2,4})"([^"]+)"\s*:\s*(.*)$/);
    if (match && match[1].length === 2) {
      keyMatches.push({
        lineIdx: i,
        key: match[2],
        preview: match[3].replace(/[,{[\]]/g, '').trim(),
      });
    }
  }

  if (keyMatches.length > 0) {
    for (let idx = 0; idx < keyMatches.length; idx++) {
      const cur = keyMatches[idx];
      const startIdx = cur.lineIdx;
      let endIdx = idx + 1 < keyMatches.length ? keyMatches[idx + 1].lineIdx - 1 : n - 2;
      if (endIdx < startIdx) endIdx = startIdx;
      const rawText = lines.slice(startIdx, endIdx + 1).join('\n');
      const cjk = extractSqlBusinessKeywords(rawText.replace(/"/g, "'"));

      segments.push({
        id: `json-${startIdx + 1}-${cur.key}`,
        title: cur.key,
        subtitle: cjk.length > 0 ? cjk.join(' · ') : cur.preview || `JSON 属性 (L${startIdx + 1})`,
        badge: 'JSON',
        category: 'config',
        startLine: startIdx + 1,
        endLine: endIdx + 1,
        level: 0,
        rawText,
      });
    }
    return segments;
  }

  return parseBlankLineParagraphs(lines, 'JSON', 'config');
}

/**
 * Fallback parser that splits any document by blank lines into navigable paragraphs.
 */
function parseBlankLineParagraphs(
  lines: string[],
  badge: OutlineBadgeType = 'TEXT',
  category: OutlineCategory = 'doc'
): OutlineSegment[] {
  const segments: OutlineSegment[] = [];
  let i = 0;
  const n = lines.length;

  while (i < n) {
    if (!lines[i].trim()) {
      i++;
      continue;
    }
    const startIdx = i;
    let endIdx = i;
    while (endIdx + 1 < n && lines[endIdx + 1].trim() !== '') {
      endIdx++;
    }
    const paraLines = lines.slice(startIdx, endIdx + 1);
    const rawText = paraLines.join('\n');

    // If a plaintext paragraph is actually SQL statements, parse it as SQL!
    if (paraLines.some((l) => isLikelySqlStatementLine(l.trim()))) {
      segments.push(...parseSqlRange(paraLines, startIdx + 1, 0));
    } else {
      const firstLine = paraLines[0].trim();
      const secondLine = paraLines
        .slice(1, 4)
        .map((l) => l.trim())
        .filter(Boolean)
        .join(' · ');
      segments.push({
        id: `para-${startIdx + 1}`,
        title: firstLine.slice(0, 42),
        subtitle: secondLine.slice(0, 55) || `共 ${paraLines.length} 行`,
        badge,
         count: paraLines.length > 1 ? paraLines.length : undefined,
        category,
        startLine: startIdx + 1,
        endLine: endIdx + 1,
        level: 0,
        rawText,
      });
    }

    i = endIdx + 1;
  }

  return segments;
}

/**
 * Main entry point: parses any document into zero-config OutlineSegments.
 */
export function parseSmartOutline(code: string, language: string): OutlineSegment[] {
  if (!code || !code.trim()) {
    return [];
  }

  const lines = code.replace(/\r\n/g, '\n').split('\n');
  const lang = (language || 'plaintext').toLowerCase();

  if (lang === 'sql' || lang === 'mysql' || lang === 'pgsql') {
    return parseSqlRange(lines, 1, 0);
  }

  if (lang === 'markdown' || lang === 'md') {
    return parseMarkdownOutline(lines);
  }

  if (lang === 'yaml' || lang === 'yml') {
    return parseYamlOutline(lines);
  }

  if (lang === 'json') {
    return parseJsonOutline(lines);
  }

  // Auto-detect if plaintext/other actually contains SQL statements or Markdown headings
  const hasSql = lines.some((l) => isLikelySqlStatementLine(l.trim()));
  const hasMdHeading = lines.some((l) => /^#{1,6}\s+/.test(l.trim()) || /^`{3,}/.test(l.trim()));

  if (hasMdHeading) {
    return parseMarkdownOutline(lines);
  }
  if (hasSql) {
    return parseBlankLineParagraphs(lines, 'TEXT', 'doc');
  }

  return parseBlankLineParagraphs(lines, 'TEXT', 'doc');
}

/**
 * Returns foldable line ranges (startLine, endLine) for multi-line segments.
 */
export function getSemanticFoldingRanges(
  segments: OutlineSegment[]
): { start: number; end: number }[] {
  return segments
    .filter((seg) => seg.endLine > seg.startLine)
    .map((seg) => ({
      start: seg.startLine,
      end: seg.endLine,
    }));
}
