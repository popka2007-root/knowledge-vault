import { describe, it, expect } from 'vitest';
import {
  parseMarkdownTable,
  formatMarkdownTable,
  extractMarkdownTables,
  extractWikiLinks,
  extractTags,
  insertWikiLinkAtCursor,
  applySlashCommand,
  applyFormattingToSelection
} from '../utils/editorUtils';

describe('Editor Utilities & Parsing Engine (M1)', () => {
  describe('GFM Markdown Table Parsing & Formatting', () => {
    it('should correctly parse a standard GFM table', () => {
      const markdownTable = `
| Header 1 | Header 2 | Header 3 |
| --- | --- | --- |
| Row 1 Col 1 | Row 1 Col 2 | Row 1 Col 3 |
| Row 2 Col 1 | Row 2 Col 2 | Row 2 Col 3 |
      `.trim();

      const parsed = parseMarkdownTable(markdownTable);
      expect(parsed).not.toBeNull();
      expect(parsed?.headers).toEqual(['Header 1', 'Header 2', 'Header 3']);
      expect(parsed?.rows).toHaveLength(2);
      expect(parsed?.rows[0]).toEqual(['Row 1 Col 1', 'Row 1 Col 2', 'Row 1 Col 3']);
      expect(parsed?.rows[1]).toEqual(['Row 2 Col 1', 'Row 2 Col 2', 'Row 2 Col 3']);
    });

    it('should return null when parsing invalid table markdown', () => {
      const invalid = 'Just a regular line of text without table structure';
      expect(parseMarkdownTable(invalid)).toBeNull();
    });

    it('should format headers and rows into clean GFM Markdown table', () => {
      const headers = ['Task', 'Status', 'Assignee'];
      const rows = [
        ['M1 Engine', 'In Progress', 'Worker M1'],
        ['M2 Storage', 'Pending', 'Worker M2']
      ];

      const formatted = formatMarkdownTable(headers, rows);
      expect(formatted).toContain('| Task | Status | Assignee |');
      expect(formatted).toContain('| --- | --- | --- |');
      expect(formatted).toContain('| M1 Engine | In Progress | Worker M1 |');
    });

    it('should pad rows with empty strings if row length is less than headers length', () => {
      const headers = ['Col 1', 'Col 2', 'Col 3'];
      const shortRows = [['Val 1']];

      const formatted = formatMarkdownTable(headers, shortRows);
      expect(formatted).toBe('| Col 1 | Col 2 | Col 3 |\n| --- | --- | --- |\n| Val 1 |  |  |');
    });

    it('should extract multiple tables from a full markdown document', () => {
      const document = `
# Project Plan

Here is table 1:
| Feature | Priority |
| --- | --- |
| Editor | High |
| Search | Medium |

Some intermediate text.

| Metrics | Value |
| --- | --- |
| Coverage | 95% |
      `.trim();

      const tables = extractMarkdownTables(document);
      expect(tables).toHaveLength(2);
      expect(tables[0].headers).toEqual(['Feature', 'Priority']);
      expect(tables[1].headers).toEqual(['Metrics', 'Value']);
    });
  });

  describe('WikiLink Extraction & Autocompletion', () => {
    it('should extract unique WikiLinks from markdown text', () => {
      const content = 'Refer to [[Project Roadmap]] and [[Architecture Notes]] and also [[Project Roadmap]] again.';
      const links = extractWikiLinks(content);
      expect(links).toEqual(['Project Roadmap', 'Architecture Notes']);
    });

    it('should return empty array when no WikiLinks exist', () => {
      expect(extractWikiLinks('Standard text with no links.')).toEqual([]);
    });

    it('should autocomplete WikiLink at cursor position', () => {
      const text = 'Check out [[Arch';
      const cursor = text.length;
      const result = insertWikiLinkAtCursor(text, cursor, 'Architecture Notes');
      expect(result.newContent).toBe('Check out [[Architecture Notes]]');
      expect(result.newCursor).toBe('Check out [[Architecture Notes]]'.length);
    });

    it('should insert new WikiLink if cursor is not inside partial trigger', () => {
      const text = 'See details in ';
      const cursor = text.length;
      const result = insertWikiLinkAtCursor(text, cursor, 'Design Document');
      expect(result.newContent).toBe('See details in [[Design Document]]');
    });
  });

  describe('Tag Extraction', () => {
    it('should extract valid tags and ignore markdown headers', () => {
      const markdown = '# Heading 1\n\nThis note is related to #milestone1 and #core_engine.';
      const tags = extractTags(markdown);
      expect(tags).toContain('milestone1');
      expect(tags).toContain('core_engine');
      expect(tags).not.toContain('Heading');
    });
  });

  describe('Slash Commands & Selection Transformations', () => {
    it('should replace slash command prompt with inserted template', () => {
      const text = 'Line 1\n/table';
      const cursor = text.length;
      const commandText = '| H1 | H2 |\n| --- | --- |\n| C1 | C2 |\n';

      const result = applySlashCommand(text, cursor, commandText);
      expect(result.newContent).toBe('Line 1\n| H1 | H2 |\n| --- | --- |\n| C1 | C2 |\n');
    });

    it('should wrap selected text with prefix and suffix', () => {
      const text = 'Make this bold text here';
      const selectionStart = 10; // 'bold'
      const selectionEnd = 14;

      const result = applyFormattingToSelection(text, selectionStart, selectionEnd, '**', '**');
      expect(result.newContent).toBe('Make this **bold** text here');
      expect(result.newSelectionStart).toBe(12);
      expect(result.newSelectionEnd).toBe(16);
    });
  });
});
