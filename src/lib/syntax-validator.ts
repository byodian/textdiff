import { parseDocument, YAMLParseError, YAMLWarning } from 'yaml';

export type DiagnosticSeverity = 'error' | 'warning' | 'info';

export interface QuickFixAction {
  label: string;
  apply: (originalCode: string) => string;
}

export interface SyntaxDiagnostic {
  id: string;
  line: number; // 1-indexed
  column: number; // 1-indexed
  endLine?: number;
  endColumn?: number;
  severity: DiagnosticSeverity;
  message: string;
  suggestion?: string;
  rule?: string;
  quickFix?: QuickFixAction;
}

/**
 * Accurately indexes line start offsets for LF, CRLF, and CR line endings.
 */
export function buildLineIndex(text: string): number[] {
  const lineStarts = [0];
  const len = text.length;
  for (let i = 0; i < len; i++) {
    const ch = text.charCodeAt(i);
    if (ch === 10) {
      // \n
      lineStarts.push(i + 1);
    } else if (ch === 13) {
      // \r
      if (i + 1 < len && text.charCodeAt(i + 1) === 10) {
        lineStarts.push(i + 2);
        i++; // skip \n
      } else {
        lineStarts.push(i + 1);
      }
    }
  }
  return lineStarts;
}

/**
 * Maps a character offset to 1-indexed line and column using precomputed lineStarts.
 */
export function offsetToPosition(
  lineStarts: number[],
  offset: number
): { line: number; column: number } {
  if (offset <= 0) return { line: 1, column: 1 };
  let low = 0;
  let high = lineStarts.length - 1;
  let lineIdx = 0;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (lineStarts[mid] <= offset) {
      lineIdx = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return {
    line: lineIdx + 1,
    column: offset - lineStarts[lineIdx] + 1,
  };
}

export interface JsonToken {
  type: 'string' | 'single-string' | 'number' | 'word' | 'punct' | 'comment';
  value: string;
  start: number;
  end: number;
  closed?: boolean;
}

/**
 * Lexical tokenizer for JSON documents that safely handles strings, comments,
 * and punctuation without regex-induced false positives inside string literals.
 */
export function tokenizeJson(content: string): JsonToken[] {
  const tokens: JsonToken[] = [];
  const len = content.length;
  let i = 0;

  while (i < len) {
    const ch = content[i];

    // Whitespace
    if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
      i++;
      continue;
    }

    // Line or block comments (not valid standard JSON, but common user mistake)
    if (ch === '/' && i + 1 < len) {
      const next = content[i + 1];
      if (next === '/') {
        const start = i;
        i += 2;
        while (i < len && content[i] !== '\r' && content[i] !== '\n') {
          i++;
        }
        tokens.push({ type: 'comment', value: content.slice(start, i), start, end: i });
        continue;
      }
      if (next === '*') {
        const start = i;
        i += 2;
        while (i + 1 < len && !(content[i] === '*' && content[i + 1] === '/')) {
          i++;
        }
        i = Math.min(len, i + 2);
        tokens.push({ type: 'comment', value: content.slice(start, i), start, end: i });
        continue;
      }
    }

    // Double-quoted strings
    if (ch === '"') {
      const start = i;
      i++;
      let escape = false;
      let closed = false;
      while (i < len) {
        const c = content[i];
        if (escape) {
          escape = false;
          i++;
        } else if (c === '\\') {
          escape = true;
          i++;
        } else if (c === '"') {
          i++;
          closed = true;
          break;
        } else {
          i++;
        }
      }
      tokens.push({ type: 'string', value: content.slice(start, i), start, end: i, closed });
      continue;
    }

    // Single-quoted strings (invalid in JSON)
    if (ch === "'") {
      const start = i;
      i++;
      let escape = false;
      let closed = false;
      while (i < len) {
        const c = content[i];
        if (escape) {
          escape = false;
          i++;
        } else if (c === '\\') {
          escape = true;
          i++;
        } else if (c === "'") {
          i++;
          closed = true;
          break;
        } else {
          i++;
        }
      }
      tokens.push({ type: 'single-string', value: content.slice(start, i), start, end: i, closed });
      continue;
    }

    // Structural punctuation
    if (ch === '{' || ch === '}' || ch === '[' || ch === ']' || ch === ':' || ch === ',') {
      tokens.push({ type: 'punct', value: ch, start: i, end: i + 1 });
      i++;
      continue;
    }

    // Words, identifiers, literals, numbers
    const start = i;
    while (i < len) {
      const c = content[i];
      if (
        c === ' ' ||
        c === '\t' ||
        c === '\r' ||
        c === '\n' ||
        c === '{' ||
        c === '}' ||
        c === '[' ||
        c === ']' ||
        c === ':' ||
        c === ',' ||
        c === '"' ||
        c === "'" ||
        (c === '/' && i + 1 < len && (content[i + 1] === '/' || content[i + 1] === '*'))
      ) {
        break;
      }
      i++;
    }
    const val = content.slice(start, i);
    if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(val)) {
      tokens.push({ type: 'number', value: val, start, end: i });
    } else {
      tokens.push({ type: 'word', value: val, start, end: i });
    }
  }

  return tokens;
}

/**
 * Cleanly removes all consecutive commas outside strings from JSON code.
 */
function removeConsecutiveCommas(code: string): string {
  const tokens = tokenizeJson(code);
  const nonComments = tokens.filter((t) => t.type !== 'comment');
  const removals: Array<{ start: number; end: number }> = [];

  for (let i = 0; i < nonComments.length; i++) {
    const tok = nonComments[i];
    if (tok.type === 'punct' && tok.value === ',') {
      let extraCount = 0;
      while (
        i + 1 + extraCount < nonComments.length &&
        nonComments[i + 1 + extraCount].type === 'punct' &&
        nonComments[i + 1 + extraCount].value === ','
      ) {
        extraCount++;
      }
      if (extraCount > 0) {
        const firstExtra = nonComments[i + 1];
        const lastExtra = nonComments[i + extraCount];
        removals.push({ start: firstExtra.start, end: lastExtra.end });
        i += extraCount;
      }
    }
  }

  let result = code;
  for (let r = removals.length - 1; r >= 0; r--) {
    const { start, end } = removals[r];
    result = result.slice(0, start) + result.slice(end);
  }
  return result;
}

/**
 * Validates JSON text and returns structured diagnostics with exact positions,
 * human-friendly explanations, multi-error detection, and actionable suggestions.
 */
export function validateJsonSyntax(content: string): SyntaxDiagnostic[] {
  const text = (content || '').trim();
  if (!text) return [];

  // Check if completely valid JSON first
  try {
    JSON.parse(text);
    return [];
  } catch {
    // Proceed to detailed diagnostic analysis
  }

  const lineStarts = buildLineIndex(content);
  const diagnostics: SyntaxDiagnostic[] = [];
  const tokens = tokenizeJson(content);

  // 1. Check for comments (standard JSON does not support comments)
  for (const tok of tokens) {
    if (tok.type === 'comment') {
      const sPos = offsetToPosition(lineStarts, tok.start);
      const ePos = offsetToPosition(lineStarts, tok.end);
      diagnostics.push({
        id: `json-comment-${tok.start}`,
        line: sPos.line,
        column: sPos.column,
        endLine: ePos.line,
        endColumn: ePos.column,
        severity: 'error',
        rule: 'json/no-comments',
        message: 'JSON 不支持代码注释 (Comments not allowed in JSON)',
        suggestion:
          '标准 JSON 规范不允许使用 // 或 /* */ 注释。建议移除注释，或切换到支持注释的 YAML 格式。',
        quickFix: {
          label: '一键清除注释 (Remove Comments)',
          apply: (code) => code.replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, ''),
        },
      });
    }
  }

  // 2. Check for single quotes around keys or strings
  for (const tok of tokens) {
    if (tok.type === 'single-string') {
      const sPos = offsetToPosition(lineStarts, tok.start);
      const ePos = offsetToPosition(lineStarts, tok.end);
      diagnostics.push({
        id: `json-single-quote-${tok.start}`,
        line: sPos.line,
        column: sPos.column,
        endLine: ePos.line,
        endColumn: ePos.column,
        severity: 'error',
        rule: 'json/single-quote',
        message: '使用了单引号 (Single quotes are not allowed in JSON)',
        suggestion: 'JSON 规范严格要求字符串和对象键名必须使用双引号 (") 包裹。',
        quickFix: {
          label: '一键转换为双引号 (Convert to Double Quotes)',
          apply: (code) =>
            code.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_, inner) => {
              return `"${inner.replace(/"/g, '\\"')}"`;
            }),
        },
      });
    }
  }

  // 3. Check for unclosed string literals
  for (const tok of tokens) {
    if (
      (tok.type === 'string' || tok.type === 'single-string') &&
      tok.closed === false
    ) {
      const sPos = offsetToPosition(lineStarts, tok.start);
      const ePos = offsetToPosition(lineStarts, tok.end);
      diagnostics.push({
        id: `json-unclosed-string-${tok.start}`,
        line: sPos.line,
        column: sPos.column,
        endLine: ePos.line,
        endColumn: ePos.column,
        severity: 'error',
        rule: 'json/unclosed-string',
        message: '字符串未正确闭合 (Unclosed string literal)',
        suggestion: '检测到未闭合的字符串，请检查双引号是否成对出现。',
        quickFix: {
          label: '补充闭合引号',
          apply: (code) =>
            code.slice(0, tok.end) +
            (tok.type === 'string' ? '"' : "'") +
            code.slice(tok.end),
        },
      });
    }
  }

  // 4. Check for Python/JS boolean and null literal casing (True, False, None, undefined, NaN)
  for (const tok of tokens) {
    if (tok.type === 'word') {
      const word = tok.value;
      if (['True', 'False', 'None', 'undefined', 'NaN'].includes(word)) {
        const sPos = offsetToPosition(lineStarts, tok.start);
        const ePos = offsetToPosition(lineStarts, tok.end);
        const replacement =
          word === 'True' ? 'true' : word === 'False' ? 'false' : 'null';
        diagnostics.push({
          id: `json-invalid-literal-${tok.start}`,
          line: sPos.line,
          column: sPos.column,
          endLine: ePos.line,
          endColumn: ePos.column,
          severity: 'error',
          rule: 'json/literal-casing',
          message: `非法的字面量 "${word}" (Invalid literal "${word}")`,
          suggestion: `JSON 规范仅支持小写的 true、false 和 null，请将 "${word}" 替换为 "${replacement}"。`,
          quickFix: {
            label: `替换为 ${replacement}`,
            apply: (code) =>
              code.replace(/\b(True|False|None|undefined|NaN)\b/g, (m) =>
                m === 'True' ? 'true' : m === 'False' ? 'false' : 'null'
              ),
          },
        });
      }
    }
  }

  const nonComments = tokens.filter((t) => t.type !== 'comment');

  // 5. Check for consecutive commas (,, or ,,, etc.) outside strings
  let ci = 0;
  while (ci < nonComments.length) {
    const tok = nonComments[ci];
    if (tok.type === 'punct' && tok.value === ',') {
      let extraCount = 0;
      while (
        ci + 1 + extraCount < nonComments.length &&
        nonComments[ci + 1 + extraCount].type === 'punct' &&
        nonComments[ci + 1 + extraCount].value === ','
      ) {
        extraCount++;
      }
      if (extraCount > 0) {
        const firstExtra = nonComments[ci + 1];
        const lastExtra = nonComments[ci + extraCount];
        const sPos = offsetToPosition(lineStarts, firstExtra.start);
        const ePos = offsetToPosition(lineStarts, lastExtra.end);

        diagnostics.push({
          id: `json-consecutive-comma-${firstExtra.start}`,
          line: sPos.line,
          column: sPos.column,
          endLine: ePos.line,
          endColumn: ePos.column,
          severity: 'error',
          rule: 'json/consecutive-comma',
          message: '连续的多余逗号 (Consecutive commas in JSON)',
          suggestion:
            '检测到连续的多余逗号，标准 JSON 不允许出现连续逗号或空元素，请删除多余的逗号。',
          quickFix: {
            label: '一键删除多余逗号 (Remove Extra Comma)',
            apply: (code) => {
              const s = firstExtra.start;
              const e = lastExtra.end;
              if (s < code.length && code.slice(s, e).includes(',')) {
                return code.slice(0, s) + code.slice(e);
              }
              return removeConsecutiveCommas(code);
            },
          },
        });

        ci += 1 + extraCount;
        continue;
      }
    }
    ci++;
  }

  // 6. Check for trailing commas in objects or arrays
  for (let j = 0; j < nonComments.length; j++) {
    const tok = nonComments[j];
    if (tok.type === 'punct' && tok.value === ',') {
      const next = nonComments[j + 1];
      if (next && next.type === 'punct' && (next.value === '}' || next.value === ']')) {
        const sPos = offsetToPosition(lineStarts, tok.start);
        const ePos = offsetToPosition(lineStarts, tok.end);
        diagnostics.push({
          id: `json-trailing-comma-${tok.start}`,
          line: sPos.line,
          column: sPos.column,
          endLine: ePos.line,
          endColumn: ePos.column,
          severity: 'error',
          rule: 'json/trailing-comma',
          message: '多余的尾随逗号 (Trailing comma in JSON)',
          suggestion:
            '标准 JSON 不支持在对象末项或数组末尾保留多余的逗号，请删除此处的逗号 ","。',
          quickFix: {
            label: '一键移除尾随逗号 (Remove Trailing Comma)',
            apply: (code) => code.replace(/,+(\s*[}\]])/g, '$1'),
          },
        });
      }
    }
  }

  // 7. Check for leading commas in objects or arrays ([ , 1 ] or { , "a": 1 })
  for (let j = 0; j < nonComments.length; j++) {
    const tok = nonComments[j];
    if (tok.type === 'punct' && (tok.value === '{' || tok.value === '[')) {
      const next = nonComments[j + 1];
      if (next && next.type === 'punct' && next.value === ',') {
        const sPos = offsetToPosition(lineStarts, next.start);
        const ePos = offsetToPosition(lineStarts, next.end);
        diagnostics.push({
          id: `json-leading-comma-${next.start}`,
          line: sPos.line,
          column: sPos.column,
          endLine: ePos.line,
          endColumn: ePos.column,
          severity: 'error',
          rule: 'json/leading-comma',
          message: '多余的开头逗号 (Leading comma in JSON)',
          suggestion:
            '标准 JSON 不支持在对象或数组开头放置逗号，请删除此处的逗号 ","。',
          quickFix: {
            label: '一键删除开头逗号 (Remove Leading Comma)',
            apply: (code) => code.slice(0, next.start) + code.slice(next.end),
          },
        });
      }
    }
  }

  // 8. Check for unquoted property keys (e.g., { foo: 1 })
  for (let j = 0; j < nonComments.length; j++) {
    const tok = nonComments[j];
    if (tok.type === 'word') {
      const next = nonComments[j + 1];
      if (next && next.type === 'punct' && next.value === ':') {
        const key = tok.value;
        const sPos = offsetToPosition(lineStarts, tok.start);
        const ePos = offsetToPosition(lineStarts, tok.end);
        diagnostics.push({
          id: `json-unquoted-key-${tok.start}`,
          line: sPos.line,
          column: sPos.column,
          endLine: ePos.line,
          endColumn: ePos.column,
          severity: 'error',
          rule: 'json/unquoted-key',
          message: `键名 "${key}" 缺少双引号 (Unquoted property key)`,
          suggestion: `JSON 对象的属性键名必须使用双引号包裹，例如: "${key}": ...`,
          quickFix: {
            label: `为 "${key}" 添加双引号`,
            apply: (code) =>
              code.replace(/([{\s,])([a-zA-Z_$][a-zA-Z0-9_$-]*)\s*:/g, '$1"$2":'),
          },
        });
      }
    }
  }

  // 9. Structural check: bracket/brace balance, missing commas, and mismatched delimiters
  interface StackItem {
    type: '{' | '[';
    start: number;
    expecting: 'key' | 'colon' | 'value' | 'comma';
  }

  const stack: StackItem[] = [];

  const recordMissingComma = (prevTok: JsonToken, nextTok: JsonToken) => {
    const sPos = offsetToPosition(lineStarts, prevTok.end);
    diagnostics.push({
      id: `json-missing-comma-${prevTok.end}`,
      line: sPos.line,
      column: sPos.column,
      endLine: sPos.line,
      endColumn: sPos.column + 1,
      severity: 'error',
      rule: 'json/missing-comma',
      message: '缺少逗号分隔符 (Missing comma in JSON)',
      suggestion: '对象键值对或数组元素之间必须使用逗号 "," 分隔。',
      quickFix: {
        label: '一键插入逗号 (Insert Comma)',
        apply: (code) =>
          code.slice(0, prevTok.end) + ',' + code.slice(prevTok.end),
      },
    });
  };

  for (let j = 0; j < nonComments.length; j++) {
    const tok = nonComments[j];
    const top = stack[stack.length - 1];

    if (tok.type === 'punct') {
      if (tok.value === '{') {
        if (top && top.expecting === 'comma') {
          recordMissingComma(nonComments[j - 1], tok);
        }
        stack.push({ type: '{', start: tok.start, expecting: 'key' });
        continue;
      }
      if (tok.value === '[') {
        if (top && top.expecting === 'comma') {
          recordMissingComma(nonComments[j - 1], tok);
        }
        stack.push({ type: '[', start: tok.start, expecting: 'value' });
        continue;
      }
      if (tok.value === '}') {
        if (top && top.type === '{') {
          stack.pop();
          if (stack.length > 0) {
            stack[stack.length - 1].expecting = 'comma';
          }
        } else if (top && top.type === '[') {
          const sPos = offsetToPosition(lineStarts, tok.start);
          diagnostics.push({
            id: `json-unclosed-bracket-${top.start}`,
            line: sPos.line,
            column: sPos.column,
            endLine: sPos.line,
            endColumn: sPos.column + 1,
            severity: 'error',
            rule: 'json/unclosed-bracket',
            message: '缺少闭合中括号 "]" (Missing closing "]")',
            suggestion: 'JSON 数组未正确闭合，请在适当位置补充配对的 "]"。',
          });
          stack.pop();
        } else {
          const sPos = offsetToPosition(lineStarts, tok.start);
          diagnostics.push({
            id: `json-extra-brace-${tok.start}`,
            line: sPos.line,
            column: sPos.column,
            endLine: sPos.line,
            endColumn: sPos.column + 1,
            severity: 'error',
            rule: 'json/extra-brace',
            message: '多余的闭合花括号 "}" (Unexpected closing "}")',
            suggestion: '检测到多余的 "}"，请检查是否存在不匹配的对象闭合标记。',
          });
        }
        continue;
      }
      if (tok.value === ']') {
        if (top && top.type === '[') {
          stack.pop();
          if (stack.length > 0) {
            stack[stack.length - 1].expecting = 'comma';
          }
        } else if (top && top.type === '{') {
          const sPos = offsetToPosition(lineStarts, tok.start);
          diagnostics.push({
            id: `json-unclosed-brace-${top.start}`,
            line: sPos.line,
            column: sPos.column,
            endLine: sPos.line,
            endColumn: sPos.column + 1,
            severity: 'error',
            rule: 'json/unclosed-brace',
            message: '缺少闭合花括号 "}" (Missing closing "}")',
            suggestion: 'JSON 对象未正确闭合，请在适当位置补充配对的 "}"。',
          });
          stack.pop();
        } else {
          const sPos = offsetToPosition(lineStarts, tok.start);
          diagnostics.push({
            id: `json-extra-bracket-${tok.start}`,
            line: sPos.line,
            column: sPos.column,
            endLine: sPos.line,
            endColumn: sPos.column + 1,
            severity: 'error',
            rule: 'json/extra-bracket',
            message: '多余的闭合中括号 "]" (Unexpected closing "]")',
            suggestion: '检测到多余的 "]"，请检查是否存在不匹配的数组闭合标记。',
          });
        }
        continue;
      }
      if (tok.value === ':') {
        if (top && top.type === '{') {
          top.expecting = 'value';
        }
        continue;
      }
      if (tok.value === ',') {
        if (top) {
          top.expecting = top.type === '{' ? 'key' : 'value';
        }
        continue;
      }
    }

    // Value / Key token
    if (top) {
      if (top.type === '{') {
        if (top.expecting === 'comma') {
          recordMissingComma(nonComments[j - 1], tok);
          top.expecting = 'colon';
        } else if (top.expecting === 'key') {
          top.expecting = 'colon';
        } else if (top.expecting === 'value') {
          top.expecting = 'comma';
        }
      } else if (top.type === '[') {
        if (top.expecting === 'comma') {
          recordMissingComma(nonComments[j - 1], tok);
          top.expecting = 'comma';
        } else if (top.expecting === 'value') {
          top.expecting = 'comma';
        }
      }
    }
  }

  // Check remaining unclosed items on stack at EOF
  for (const unclosed of stack) {
    const sPos = offsetToPosition(lineStarts, unclosed.start);
    if (unclosed.type === '{') {
      diagnostics.push({
        id: `json-unclosed-brace-${unclosed.start}`,
        line: sPos.line,
        column: sPos.column,
        endLine: sPos.line,
        endColumn: sPos.column + 1,
        severity: 'error',
        rule: 'json/unclosed-brace',
        message: '缺少闭合花括号 "}" (Missing closing "}")',
        suggestion: 'JSON 对象未正确闭合，请在文档末尾补充缺少的 "}"。',
        quickFix: {
          label: '补充闭合花括号 }',
          apply: (code) => `${code}\n}`,
        },
      });
    } else {
      diagnostics.push({
        id: `json-unclosed-bracket-${unclosed.start}`,
        line: sPos.line,
        column: sPos.column,
        endLine: sPos.line,
        endColumn: sPos.column + 1,
        severity: 'error',
        rule: 'json/unclosed-bracket',
        message: '缺少闭合中括号 "]" (Missing closing "]")',
        suggestion: 'JSON 数组未正确闭合，请在适当位置补充缺少的 "]"。',
        quickFix: {
          label: '补充闭合中括号 ]',
          apply: (code) => `${code}\n]`,
        },
      });
    }
  }

  // 10. Fallback to native JSON.parse error if no custom rule triggered
  if (diagnostics.length === 0) {
    try {
      JSON.parse(content);
    } catch (err: any) {
      const errMsg = err?.message || 'JSON 解析错误';
      let errLine = 1;
      let errCol = 1;

      // Extract line and column from modern V8 message: "... at line X column Y"
      const lineColMatch = errMsg.match(/line (\d+) column (\d+)/i);
      if (lineColMatch) {
        errLine = parseInt(lineColMatch[1], 10);
        errCol = parseInt(lineColMatch[2], 10);
      } else {
        // Extract position: "... at position X"
        const posMatch = errMsg.match(/position (\d+)/i);
        if (posMatch) {
          const charPos = parseInt(posMatch[1], 10);
          const p = offsetToPosition(lineStarts, charPos);
          errLine = p.line;
          errCol = p.column;
        }
      }

      diagnostics.push({
        id: 'json-parse-error',
        line: errLine,
        column: errCol,
        endLine: errLine,
        endColumn: errCol + 1,
        severity: 'error',
        rule: 'json/syntax-error',
        message: `JSON 语法错误: ${errMsg}`,
        suggestion: `请检查第 ${errLine} 行第 ${errCol} 列附近的内容，确保字符串使用双引号包裹，键值对使用冒号连接，项与项之间使用逗号分隔。`,
      });
    }
  }

  // Deduplicate and sort by line & column
  return deduplicateAndSort(diagnostics);
}

/**
 * Validates YAML text and returns structured diagnostics with exact positions,
 * friendly explanations, and actionable suggestions.
 */
export function validateYamlSyntax(content: string): SyntaxDiagnostic[] {
  const text = (content || '').trim();
  if (!text) return [];

  const diagnostics: SyntaxDiagnostic[] = [];
  const lines = content.split(/\r?\n/);

  // 1. Check for tab characters in indentation (strict YAML requirement)
  lines.forEach((line, idx) => {
    const tabMatch = line.match(/^(\t+)/);
    if (tabMatch) {
      diagnostics.push({
        id: `yaml-tab-${idx}`,
        line: idx + 1,
        column: 1,
        severity: 'error',
        rule: 'yaml/no-tabs',
        message: 'YAML 缩进中包含制表符 Tab (Tabs are forbidden in YAML indentation)',
        suggestion: 'YAML 规范严禁使用 Tab 键进行缩进对齐，必须使用纯空格（推荐 2 个空格）。',
        quickFix: {
          label: '一键将 Tab 转为 2 空格 (Replace Tabs with Spaces)',
          apply: (code) =>
            code
              .split(/\r?\n/)
              .map((l) => l.replace(/^(\t+)/, (_, tabs) => '  '.repeat(tabs.length)))
              .join('\n'),
        },
      });
    }
  });

  // 2. Check for missing space after colon (e.g. key:value instead of key: value)
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) return; // ignore comments
    // Matches key:value where value is not a path or url
    const colonNoSpaceMatch = line.match(/^([ \t]*[\w$-]+):([^\s\r\n/#][^\s\r\n]*)/);
    if (colonNoSpaceMatch && !line.includes('://')) {
      const col = line.indexOf(':') + 1;
      diagnostics.push({
        id: `yaml-missing-space-${idx}`,
        line: idx + 1,
        column: col,
        severity: 'error',
        rule: 'yaml/missing-space-after-colon',
        message: '冒号 ":" 后缺少空格 (Missing space after colon)',
        suggestion: 'YAML 键值对中的冒号 ":" 后面必须跟至少一个空格。',
        quickFix: {
          label: '一键补充冒号后空格 (Insert Space After Colon)',
          apply: (code) =>
            code
              .split(/\r?\n/)
              .map((l) => {
                if (l.trim().startsWith('#') || l.includes('://')) return l;
                return l.replace(/^([ \t]*[\w$-]+):([^\s\r\n/#])/, '$1: $2');
              })
              .join('\n'),
        },
      });
    }
  });

  // 3. Parse using yaml package
  try {
    const doc = parseDocument(content, { prettyErrors: true });

    const lineStarts = buildLineIndex(content);

    // Collect errors
    doc.errors.forEach((err: YAMLParseError, idx: number) => {
      let line = 1;
      let column = 1;
      if (err.linePos && err.linePos[0]) {
        line = err.linePos[0].line;
        column = err.linePos[0].col;
      } else if (typeof (err as any).pos?.[0] === 'number') {
        const p = (err as any).pos[0];
        const pos = offsetToPosition(lineStarts, p);
        line = pos.line;
        column = pos.column;
      }

      let suggestion = '检查此处的 YAML 缩进层级、键值对格式与特殊符号。';
      const cleanMsg = err.message.split('\n')[0].replace(/^YAML:?\s*/i, '').trim();

      if (/tab/i.test(cleanMsg)) {
        suggestion = 'YAML 缩进必须使用纯空格，禁止使用 Tab 制表符。';
      } else if (/mapping/i.test(cleanMsg) || /indent/i.test(cleanMsg)) {
        suggestion = '检查该行与其父节点的缩进对齐，确保同级项使用相同数量的空格。';
      } else if (/implicit key/i.test(cleanMsg)) {
        suggestion = '键名可能包含未转义的特殊字符，或者缺少换行/冒号。建议使用单引号或双引号包裹。';
      } else if (/duplicate/i.test(cleanMsg)) {
        suggestion = '当前层级存在同名键，请删除或重命名重复的键名。';
      }

      diagnostics.push({
        id: `yaml-err-${idx}`,
        line: Math.max(1, line),
        column: Math.max(1, column),
        severity: 'error',
        rule: `yaml/${err.code || 'syntax-error'}`,
        message: `YAML 语法错误: ${cleanMsg}`,
        suggestion,
      });
    });

    // Collect warnings
    doc.warnings.forEach((warn: YAMLWarning, idx: number) => {
      let line = 1;
      let column = 1;
      if (warn.linePos && warn.linePos[0]) {
        line = warn.linePos[0].line;
        column = warn.linePos[0].col;
      }
      diagnostics.push({
        id: `yaml-warn-${idx}`,
        line: Math.max(1, line),
        column: Math.max(1, column),
        severity: 'warning',
        rule: 'yaml/warning',
        message: `YAML 警告: ${warn.message.split('\n')[0]}`,
        suggestion: '建议根据 YAML 规范优化该配置项的书写方式。',
      });
    });
  } catch (ex: any) {
    diagnostics.push({
      id: 'yaml-fatal-error',
      line: 1,
      column: 1,
      severity: 'error',
      rule: 'yaml/fatal',
      message: `YAML 解析失败: ${ex?.message || '未知错误'}`,
      suggestion: '请检查文本是否为有效的 YAML 文档结构。',
    });
  }

  return deduplicateAndSort(diagnostics);
}

/**
 * Validates XML / HTML tag structure and checks for unclosed tags or mismatched elements.
 */
export function validateXmlSyntax(content: string, isHtml = false): SyntaxDiagnostic[] {
  const text = (content || '').trim();
  if (!text) return [];

  const diagnostics: SyntaxDiagnostic[] = [];
  const lines = content.split(/\r?\n/);

  // Void elements for HTML
  const HTML_VOID_TAGS = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr', '!doctype'
  ]);

  const tagRegex = /<(\/)?([a-zA-Z0-9_-]+)([^>]*)>/g;
  let match: RegExpExecArray | null;

  interface TagItem {
    name: string;
    line: number;
    column: number;
  }

  const stack: TagItem[] = [];

  const indexToPos = (idx: number): { line: number; column: number } => {
    let currentIdx = 0;
    for (let l = 0; l < lines.length; l++) {
      const lineLen = lines[l].length + 1;
      if (currentIdx + lineLen > idx) {
        return { line: l + 1, column: Math.max(1, idx - currentIdx + 1) };
      }
      currentIdx += lineLen;
    }
    return { line: lines.length, column: 1 };
  };

  while ((match = tagRegex.exec(content)) !== null) {
    const isClosing = match[1] === '/';
    const tagName = match[2].toLowerCase();
    const rest = match[3] || '';
    const pos = indexToPos(match.index);

    // Skip XML declaration <?xml ...?> or comments <!-- ... --> or DOCTYPE
    if (tagName.startsWith('?') || tagName.startsWith('!--')) continue;

    // Self-closing <tag ... />
    if (rest.trim().endsWith('/')) continue;

    // Void HTML tags
    if (isHtml && HTML_VOID_TAGS.has(tagName)) continue;

    if (!isClosing) {
      stack.push({ name: tagName, line: pos.line, column: pos.column });
    } else {
      if (stack.length === 0) {
        diagnostics.push({
          id: `xml-unexpected-close-${match.index}`,
          line: pos.line,
          column: pos.column,
          severity: 'error',
          rule: 'xml/unexpected-closing-tag',
          message: `多余的闭合标签 "</${match[2]}>" (Unexpected closing tag)`,
          suggestion: `没有找到与 "</${match[2]}>" 对应的开启标签，请检查是否有遗漏或多余的标签。`,
        });
      } else {
        const matchingIndex = stack.map((s) => s.name).lastIndexOf(tagName);
        if (matchingIndex !== -1) {
          while (stack.length - 1 > matchingIndex) {
            const unclosed = stack.pop()!;
            diagnostics.push({
              id: `xml-unclosed-tag-${unclosed.line}-${unclosed.column}`,
              line: unclosed.line,
              column: unclosed.column,
              severity: 'error',
              rule: 'xml/unclosed-tag',
              message: `标签 "<${unclosed.name}>" 未闭合 (Unclosed tag)`,
              suggestion: `在第 ${pos.line} 行的 "</${tagName}>" 之前添加闭合标签 "</${unclosed.name}>"。`,
              quickFix: {
                label: `添加 </${unclosed.name}>`,
                apply: (code) => `${code}\n</${unclosed.name}>`,
              },
            });
          }
          stack.pop(); // pop matched tag
        } else {
          const last = stack.pop()!;
          diagnostics.push({
            id: `xml-mismatched-tag-${match.index}`,
            line: pos.line,
            column: pos.column,
            severity: 'error',
            rule: 'xml/mismatched-tag',
            message: `标签闭合不匹配: 期望 "</${last.name}>"，但遇到了 "</${match[2]}>"`,
            suggestion: `请检查第 ${last.line} 行的 "<${last.name}>" 标签是否已正确闭合。`,
          });
        }
      }
    }
  }

  // Report any remaining unclosed tags
  while (stack.length > 0) {
    const unclosed = stack.pop()!;
    diagnostics.push({
      id: `xml-unclosed-tag-${unclosed.line}-${unclosed.column}`,
      line: unclosed.line,
      column: unclosed.column,
      severity: 'error',
      rule: 'xml/unclosed-tag',
      message: `标签 "<${unclosed.name}>" 未闭合 (Unclosed tag)`,
      suggestion: `在文档适当位置添加闭合标签 "</${unclosed.name}>"。`,
      quickFix: {
        label: `在末尾添加 </${unclosed.name}>`,
        apply: (code) => `${code}\n</${unclosed.name}>`,
      },
    });
  }

  return deduplicateAndSort(diagnostics);
}

/**
 * Validates Markdown syntax issues such as unclosed code fences.
 */
export function validateMarkdownSyntax(content: string): SyntaxDiagnostic[] {
  const text = (content || '').trim();
  if (!text) return [];

  const diagnostics: SyntaxDiagnostic[] = [];
  const lines = content.split(/\r?\n/);

  let inCodeFence = false;
  let fenceStartLine = 1;

  lines.forEach((line, idx) => {
    if (/^```/.test(line)) {
      if (!inCodeFence) {
        inCodeFence = true;
        fenceStartLine = idx + 1;
      } else {
        inCodeFence = false;
      }
    }
  });

  if (inCodeFence) {
    diagnostics.push({
      id: `md-unclosed-fence-${fenceStartLine}`,
      line: fenceStartLine,
      column: 1,
      severity: 'error',
      rule: 'markdown/unclosed-code-fence',
      message: '代码块未闭合 (Unclosed markdown code fence ```)',
      suggestion: `第 ${fenceStartLine} 行开启的代码块未找到配对的闭合 "\`\`\`"，请在代码块末尾补充 "\`\`\`"。`,
      quickFix: {
        label: '一键补充代码块闭合标记 ```',
        apply: (code) => `${code}\n\`\`\``,
      },
    });
  }

  return deduplicateAndSort(diagnostics);
}

/**
 * Universal syntax validator entry point.
 */
export function validateSyntax(code: string, language: string): SyntaxDiagnostic[] {
  const lang = (language || '').toLowerCase();
  switch (lang) {
    case 'json':
      return validateJsonSyntax(code);
    case 'yaml':
    case 'yml':
      return validateYamlSyntax(code);
    case 'xml':
    case 'svg':
      return validateXmlSyntax(code, false);
    case 'html':
      return validateXmlSyntax(code, true);
    case 'markdown':
    case 'md':
      return validateMarkdownSyntax(code);
    default:
      return [];
  }
}

/**
 * Helper to deduplicate diagnostics by line + rule and sort in document order.
 */
function deduplicateAndSort(items: SyntaxDiagnostic[]): SyntaxDiagnostic[] {
  const seen = new Set<string>();
  const unique: SyntaxDiagnostic[] = [];

  for (const d of items) {
    const key = `${d.line}:${d.column}:${d.rule}:${d.message}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(d);
    }
  }

  return unique.sort((a, b) => {
    if (a.line !== b.line) return a.line - b.line;
    return a.column - b.column;
  });
}
