/**
 * Editor Utilities & Markdown AST Helper Functions for Milestone M1
 */

/**
 * Extract bi-directional [[wikilinks]] from markdown content
 */
export function extractWikiLinks(markdownContent: string): string[] {
  if (!markdownContent) return [];
  const wikiLinkRegex = /\[\[(.*?)\]\]/g;
  const links: string[] = [];
  let match;
  while ((match = wikiLinkRegex.exec(markdownContent)) !== null) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    const target = raw.split('|')[0].trim();
    if (target && !links.includes(target)) {
      links.push(target);
    }
  }
  return links;
}

/**
 * Extract #tags from markdown content
 */
export function extractTags(markdownContent: string): string[] {
  if (!markdownContent) return [];
  const tagRegex = /(?:^|\s)#(?!\d+(?:\s|$)|[-_]+(?:\s|$))([\p{L}\p{N}_\-]+)/gu;
  const tags: string[] = [];
  let match;
  while ((match = tagRegex.exec(markdownContent)) !== null) {
    const tag = match[1]?.trim();
    if (tag && !tags.includes(tag)) {
      tags.push(tag);
    }
  }
  return tags;
}

export interface ParsedTable {
  raw: string;
  index: number;
  headers: string[];
  rows: string[][];
}

/**
 * Parse a single GFM Markdown table block into headers and rows
 */
export function parseMarkdownTable(tableMarkdown: string): { headers: string[]; rows: string[][] } | null {
  if (!tableMarkdown) return null;
  const lines = tableMarkdown.trim().split(/\r?\n/).map(l => l.trim()).filter(l => l.includes('|'));
  if (lines.length < 2) return null;

  const parseRow = (line: string) => {
    let cells = line.split('|');
    // Remove leading and trailing empty elements caused by surrounding pipes
    if (cells.length > 0 && cells[0].trim() === '') cells.shift();
    if (cells.length > 0 && cells[cells.length - 1].trim() === '') cells.pop();
    return cells.map(c => c.trim());
  };

  const headers = parseRow(lines[0]);
  const dividerCells = parseRow(lines[1]);
  const isDivider = dividerCells.length > 0 && dividerCells.every(cell => /^:?-+:?$/.test(cell));
  if (!isDivider) return null;

  const rowLines = lines.slice(2);
  const rows = rowLines.map(parseRow);

  return { headers, rows };
}

/**
 * Format headers and rows array into a GFM Markdown table string
 */
export function formatMarkdownTable(headers: string[], rows: string[][]): string {
  if (!headers || headers.length === 0) return '';
  const headerLine = `| ${headers.join(' | ')} |`;
  const dividerLine = `| ${headers.map(() => '---').join(' | ')} |`;
  const rowLines = (rows || []).map(row => {
    // Ensure row has same length as headers
    const paddedRow = headers.map((_, colIdx) => row[colIdx] ?? '');
    return `| ${paddedRow.join(' | ')} |`;
  });

  return [headerLine, dividerLine, ...rowLines].join('\n');
}

/**
 * Extract all GFM Markdown table blocks from document content
 */
export function extractMarkdownTables(content: string): ParsedTable[] {
  if (!content) return [];
  const tables: ParsedTable[] = [];
  const tableRegex = /((?:\|[^\n]+\|\r?\n?){2,})/g;
  let match;

  while ((match = tableRegex.exec(content)) !== null) {
    const raw = match[1].trim();
    const parsed = parseMarkdownTable(raw);
    if (parsed) {
      tables.push({
        raw,
        index: match.index,
        headers: parsed.headers,
        rows: parsed.rows
      });
    }
  }

  return tables;
}

/**
 * Insert or replace WikiLink at cursor position
 */
export function insertWikiLinkAtCursor(
  content: string,
  cursorIndex: number,
  linkTitle: string
): { newContent: string; newCursor: number } {
  const safeCursor = Math.max(0, Math.min(cursorIndex, content.length));
  const beforeCursor = content.substring(0, safeCursor);
  let afterCursor = content.substring(safeCursor);

  const lastNewline = beforeCursor.lastIndexOf('\n');
  const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
  const matchIndex = beforeCursor.lastIndexOf('[[');

  if (
    matchIndex !== -1 &&
    matchIndex >= lineStart &&
    !beforeCursor.substring(matchIndex).includes(']]')
  ) {
    if (afterCursor.startsWith(']]')) {
      afterCursor = afterCursor.substring(2);
    }
    const replacement = `[[${linkTitle}]]`;
    const newContent = content.substring(0, matchIndex) + replacement + afterCursor;
    return {
      newContent,
      newCursor: matchIndex + replacement.length
    };
  }

  const replacement = `[[${linkTitle}]]`;
  const newContent = beforeCursor + replacement + afterCursor;
  return {
    newContent,
    newCursor: safeCursor + replacement.length
  };
}

/**
 * Apply slash menu command at cursor, replacing `/search` command text if present
 */
export function applySlashCommand(
  content: string,
  cursorIndex: number,
  commandText: string
): { newContent: string; newCursor: number } {
  const safeCursor = Math.max(0, Math.min(cursorIndex, content.length));
  const beforeCursor = content.substring(0, safeCursor);
  const afterCursor = content.substring(safeCursor);

  const lastNewline = beforeCursor.lastIndexOf('\n');
  const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
  const currentLineBeforeCursor = beforeCursor.substring(lineStart);

  const slashMatch = currentLineBeforeCursor.match(/(?:^|\s)(\/[^\s]*)$/);
  if (slashMatch && slashMatch.index !== undefined && slashMatch[1]) {
    const slashOffset = slashMatch[0].length - slashMatch[1].length;
    const replaceFrom = lineStart + slashMatch.index + slashOffset;
    const newContent = content.substring(0, replaceFrom) + commandText + afterCursor;
    return {
      newContent,
      newCursor: replaceFrom + commandText.length
    };
  }

  const newContent = beforeCursor + commandText + afterCursor;
  return {
    newContent,
    newCursor: safeCursor + commandText.length
  };
}

/**
 * Wrap text selection with prefix and suffix (e.g. bold, italic)
 */
export function applyFormattingToSelection(
  content: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
  suffix: string = ''
): { newContent: string; newSelectionStart: number; newSelectionEnd: number } {
  const selectedText = content.substring(selectionStart, selectionEnd);
  const replacement = prefix + selectedText + suffix;
  const newContent = content.substring(0, selectionStart) + replacement + content.substring(selectionEnd);
  return {
    newContent,
    newSelectionStart: selectionStart + prefix.length,
    newSelectionEnd: selectionStart + prefix.length + selectedText.length
  };
}
