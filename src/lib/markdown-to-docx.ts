import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  UnderlineType,
} from 'docx';
import { Marked, Lexer, type Token, type Tokens } from 'marked';

interface TextStyle {
  bold?: boolean;
  italics?: boolean;
  strike?: boolean;
  color?: string;
  size?: number;
  underline?: { type: (typeof UnderlineType)[keyof typeof UnderlineType] };
}

/**
 * Recursively flattens inline markdown tokens into an array of docx TextRuns.
 */
function parseInlineTokens(tokens: Token[] = [], style: TextStyle = {}): TextRun[] {
  const runs: TextRun[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case 'strong': {
        const strongTok = token as Tokens.Strong;
        runs.push(...parseInlineTokens(strongTok.tokens || [], { ...style, bold: true }));
        break;
      }
      case 'em': {
        const emTok = token as Tokens.Em;
        runs.push(...parseInlineTokens(emTok.tokens || [], { ...style, italics: true }));
        break;
      }
      case 'codespan': {
        const codeTok = token as Tokens.Codespan;
        const codeText = codeTok.text || '';
        const lines = codeText.split('\n');
        lines.forEach((line, idx) => {
          if (idx > 0) {
            runs.push(new TextRun({ break: 1 }));
          }
          runs.push(
            new TextRun({
              text: line,
              font: { name: 'Consolas' },
              color: 'BE123C',
              shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
              size: style.size || 20,
              bold: style.bold,
              italics: style.italics,
            })
          );
        });
        break;
      }
      case 'del': {
        const delTok = token as Tokens.Del;
        runs.push(...parseInlineTokens(delTok.tokens || [], { ...style, strike: true }));
        break;
      }
      case 'link': {
        const linkTok = token as Tokens.Link;
        const linkText = linkTok.text || linkTok.href;
        if (linkTok.tokens && linkTok.tokens.length > 0) {
          runs.push(
            ...parseInlineTokens(linkTok.tokens, {
              ...style,
              color: '2563EB',
              underline: { type: UnderlineType.SINGLE },
            })
          );
        } else {
          runs.push(
            new TextRun({
              text: linkText,
              color: '2563EB',
              underline: { type: UnderlineType.SINGLE },
              ...style,
            })
          );
        }
        break;
      }
      case 'image': {
        const imgTok = token as Tokens.Image;
        runs.push(
          new TextRun({
            text: `[Image: ${imgTok.text || imgTok.href || 'image'}]`,
            italics: true,
            color: '64748B',
            ...style,
          })
        );
        break;
      }
      case 'text': {
        const textTok = token as Tokens.Text;
        if (textTok.tokens && textTok.tokens.length > 0) {
          runs.push(...parseInlineTokens(textTok.tokens, style));
        } else {
          const lines = (textTok.text || '').split('\n');
          lines.forEach((line, idx) => {
            if (idx > 0) {
              runs.push(new TextRun({ break: 1, ...style }));
            }
            if (line) {
              runs.push(
                new TextRun({
                  text: line,
                  ...style,
                })
              );
            }
          });
        }
        break;
      }
      case 'escape': {
        const escTok = token as Tokens.Escape;
        runs.push(new TextRun({ text: escTok.text, ...style }));
        break;
      }
      case 'br': {
        runs.push(new TextRun({ break: 1 }));
        break;
      }
      default: {
        const anyTok = token as { text?: string; raw?: string; tokens?: Token[] };
        if (anyTok.tokens && anyTok.tokens.length > 0) {
          runs.push(...parseInlineTokens(anyTok.tokens, style));
        } else {
          const rawText = anyTok.text || anyTok.raw || '';
          if (rawText) {
            const lines = rawText.split('\n');
            lines.forEach((line, idx) => {
              if (idx > 0) {
                runs.push(new TextRun({ break: 1, ...style }));
              }
              if (line) {
                runs.push(new TextRun({ text: line, ...style }));
              }
            });
          }
        }
        break;
      }
    }
  }

  return runs;
}

/**
 * Extracts and renders inline content from a list item while preserving continuation-line
 * relative indentation from `item.raw`, ignoring nested sublists.
 */
function renderListItemInline(item: Tokens.ListItem): TextRun[] {
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

      const runs: TextRun[] = [];
      rawLines.forEach((rawLine, lineIdx) => {
        if (lineIdx > 0) {
          runs.push(new TextRun({ break: 1 }));
        }
        if (!rawLine.trim()) {
          return;
        }
        if (lineIdx === 0) {
          const inlineToks = Lexer.lexInline(rawLine, { gfm: true, breaks: true });
          runs.push(...parseInlineTokens(inlineToks));
        } else {
          const expanded = rawLine.replace(/\t/g, '  ');
          const leadingSpaces = expanded.match(/^ */)?.[0].length ?? 0;
          const netIndent = Math.max(0, leadingSpaces - baseIndent);
          const contentPart = expanded.slice(leadingSpaces);
          if (netIndent > 0) {
            runs.push(new TextRun({ text: ' '.repeat(netIndent) }));
          }
          if (contentPart) {
            const inlineToks = Lexer.lexInline(contentPart, { gfm: true, breaks: true });
            runs.push(...parseInlineTokens(inlineToks));
          }
        }
      });

      if (runs.length > 0) {
        return runs;
      }
    }
  }

  const inlineRuns: TextRun[] = [];

  for (const child of item.tokens || []) {
    if (child.type === 'text') {
      const textTok = child as Tokens.Text;
      if (textTok.tokens && textTok.tokens.length > 0) {
        inlineRuns.push(...parseInlineTokens(textTok.tokens));
      } else {
        inlineRuns.push(...parseInlineTokens([textTok]));
      }
    } else if (child.type === 'paragraph') {
      const pTok = child as Tokens.Paragraph;
      if (inlineRuns.length > 0) {
        inlineRuns.push(new TextRun({ break: 1 }));
      }
      inlineRuns.push(...parseInlineTokens(pTok.tokens || []));
    } else if (child.type === 'code') {
      const codeTok = child as Tokens.Code;
      if (inlineRuns.length > 0) {
        inlineRuns.push(new TextRun({ break: 1 }));
      }
      const lines = (codeTok.text || '').split('\n');
      lines.forEach((l, idx) => {
        if (idx > 0) inlineRuns.push(new TextRun({ break: 1 }));
        inlineRuns.push(
          new TextRun({
            text: l || ' ',
            font: { name: 'Consolas, "Microsoft YaHei", monospace' },
            size: 19,
            color: '1E293B',
            shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
          })
        );
      });
    } else if (child.type !== 'list') {
      inlineRuns.push(...parseInlineTokens([child]));
    }
  }

  return inlineRuns.length > 0 ? inlineRuns : parseInlineTokens([{ type: 'text', text: item.text } as Token]);
}

/**
 * Flattens list tokens into docx Paragraphs supporting multi-level nesting.
 */
function processListToken(listTok: Tokens.List, level = 0): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const startNum = typeof listTok.start === 'number' ? listTok.start : 1;

  listTok.items.forEach((item, index) => {
    const inlineContent = renderListItemInline(item);

    if (listTok.ordered) {
      paragraphs.push(
        new Paragraph({
          indent: { left: 720 * (level + 1), hanging: 360 },
          spacing: { before: 40, after: 40, line: 260 },
          children: [
            new TextRun({ text: `${startNum + index}. `, bold: true, color: '334155' }),
            ...inlineContent,
          ],
        })
      );
    } else {
      paragraphs.push(
        new Paragraph({
          bullet: { level: Math.min(level, 8) },
          spacing: { before: 40, after: 40, line: 260 },
          children: inlineContent,
        })
      );
    }

    // Process nested sublists if any
    for (const child of item.tokens || []) {
      if (child.type === 'list') {
        paragraphs.push(...processListToken(child as Tokens.List, level + 1));
      }
    }
  });

  return paragraphs;
}

/**
 * Converts a Markdown string into a docx.Document instance.
 */
export function convertMarkdownToDocx(markdown: string, documentTitle?: string): Document {
  const marked = new Marked({
    gfm: true,
    breaks: true,
  });
  const tokens = marked.lexer(markdown || '');
  const children: (Paragraph | Table)[] = [];

  // If a document title is provided and markdown doesn't start with an H1, add an initial header
  if (documentTitle && !markdown.trim().startsWith('# ')) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.TITLE,
        spacing: { before: 100, after: 200 },
        children: [
          new TextRun({
            text: documentTitle,
            bold: true,
            size: 44, // 22pt
            color: '0F172A',
          }),
        ],
      })
    );
  }

  for (const token of tokens) {
    switch (token.type) {
      case 'heading': {
        const headingTok = token as Tokens.Heading;
        const depth = headingTok.depth;
        let headingLevel: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1;
        let beforeSpacing = 280;
        let afterSpacing = 120;

        if (depth === 2) {
          headingLevel = HeadingLevel.HEADING_2;
          beforeSpacing = 220;
          afterSpacing = 100;
        } else if (depth === 3) {
          headingLevel = HeadingLevel.HEADING_3;
          beforeSpacing = 180;
          afterSpacing = 80;
        } else if (depth === 4) {
          headingLevel = HeadingLevel.HEADING_4;
          beforeSpacing = 140;
          afterSpacing = 60;
        } else if (depth === 5) {
          headingLevel = HeadingLevel.HEADING_5;
          beforeSpacing = 120;
          afterSpacing = 50;
        } else if (depth >= 6) {
          headingLevel = HeadingLevel.HEADING_6;
          beforeSpacing = 100;
          afterSpacing = 40;
        }

        children.push(
          new Paragraph({
            heading: headingLevel,
            spacing: { before: beforeSpacing, after: afterSpacing },
            children: parseInlineTokens(headingTok.tokens || [{ type: 'text', text: headingTok.text } as Token]),
          })
        );
        break;
      }

      case 'paragraph': {
        const pTok = token as Tokens.Paragraph;
        children.push(
          new Paragraph({
            spacing: { after: 140, line: 280 },
            children: parseInlineTokens(pTok.tokens || [{ type: 'text', text: pTok.text } as Token]),
          })
        );
        break;
      }

      case 'code': {
        const codeTok = token as Tokens.Code;
        const lines = (codeTok.text || '').split('\n');

        children.push(
          new Paragraph({
            shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
            border: {
              top: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
              left: { style: BorderStyle.SINGLE, size: 12, color: '94A3B8' },
              right: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
            },
            spacing: { before: 120, after: 120, line: 240 },
            children: lines.flatMap((line, idx) => [
              new TextRun({
                text: line || ' ',
                font: { name: 'Consolas, "Microsoft YaHei", monospace' },
                size: 19, // ~9.5pt
                color: '1E293B',
                break: idx > 0 ? 1 : undefined,
              }),
            ]),
          })
        );
        break;
      }

      case 'blockquote': {
        const bqTok = token as Tokens.Blockquote;
        for (const child of bqTok.tokens || []) {
          if (child.type === 'paragraph') {
            const p = child as Tokens.Paragraph;
            children.push(
              new Paragraph({
                indent: { left: 720 },
                border: {
                  left: { style: BorderStyle.SINGLE, size: 24, color: 'CBD5E1' },
                },
                spacing: { before: 60, after: 100, line: 260 },
                children: parseInlineTokens(p.tokens || [], { color: '475569', italics: true }),
              })
            );
          } else {
            children.push(
              new Paragraph({
                indent: { left: 720 },
                border: {
                  left: { style: BorderStyle.SINGLE, size: 24, color: 'CBD5E1' },
                },
                spacing: { before: 60, after: 100, line: 260 },
                children: parseInlineTokens([child], { color: '475569', italics: true }),
              })
            );
          }
        }
        break;
      }

      case 'list': {
        children.push(...processListToken(token as Tokens.List, 0));
        break;
      }

      case 'table': {
        const tableTok = token as Tokens.Table;
        const rows: TableRow[] = [];

        // Header Row
        rows.push(
          new TableRow({
            tableHeader: true,
            children: tableTok.header.map(
              (cell) =>
                new TableCell({
                  shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
                  margins: { top: 120, bottom: 120, left: 160, right: 160 },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
                    bottom: { style: BorderStyle.SINGLE, size: 2, color: '94A3B8' },
                    left: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
                    right: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
                  },
                  children: [
                    new Paragraph({
                      children: parseInlineTokens(
                        cell.tokens || [{ type: 'text', text: cell.text } as Token],
                        { bold: true }
                      ),
                    }),
                  ],
                })
            ),
          })
        );

        // Data Rows
        tableTok.rows.forEach((row, rIdx) => {
          rows.push(
            new TableRow({
              children: row.map(
                (cell) =>
                  new TableCell({
                    shading: rIdx % 2 === 1 ? { fill: 'F8FAFC', type: ShadingType.CLEAR } : undefined,
                    margins: { top: 100, bottom: 100, left: 160, right: 160 },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
                      left: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
                      right: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
                    },
                    children: [
                      new Paragraph({
                        children: parseInlineTokens(
                          cell.tokens || [{ type: 'text', text: cell.text } as Token]
                        ),
                      }),
                    ],
                  })
              ),
            })
          );
        });

        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows,
          })
        );
        break;
      }

      case 'hr': {
        children.push(
          new Paragraph({
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 8, color: 'E2E8F0' },
            },
            spacing: { before: 180, after: 180 },
          })
        );
        break;
      }

      default:
        break;
    }
  }

  // Ensure document has at least one child paragraph
  if (children.length === 0) {
    children.push(new Paragraph({ text: '' }));
  }

  return new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Microsoft YaHei, Segoe UI, Arial, sans-serif',
            size: 22, // 11pt = 22 half-pts
            color: '1E293B',
          },
          paragraph: {
            spacing: { line: 280, after: 120 },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch = 1440 twips
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children,
      },
    ],
  });
}
