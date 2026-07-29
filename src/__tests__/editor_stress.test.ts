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

describe('M1 Stress & Adversarial Boundary Tests', () => {
  describe('1. Malformed & Edge Case Markdown Tables', () => {
    it('should return null for a single line table (missing divider & rows)', () => {
      const singleLine = '| Header 1 | Header 2 |';
      expect(parseMarkdownTable(singleLine)).toBeNull();
    });

    it('should return null for empty or whitespace-only inputs', () => {
      expect(parseMarkdownTable('')).toBeNull();
      expect(parseMarkdownTable('   \n  \t  ')).toBeNull();
    });

    it('should parse tables without outer pipes if pipe delimiters separate cells', () => {
      const tableNoOuterPipes = `Header 1 | Header 2
--- | ---
Cell 1 | Cell 2`;
      const parsed = parseMarkdownTable(tableNoOuterPipes);
      expect(parsed).not.toBeNull();
      expect(parsed?.headers).toEqual(['Header 1', 'Header 2']);
      expect(parsed?.rows[0]).toEqual(['Cell 1', 'Cell 2']);
    });

    it('should parse tables with alignment colons in divider line containing 3+ dashes', () => {
      const alignedTable = `| Left | Center | Right |
| :--- | :---: | ---: |
| L1 | C1 | R1 |`;
      const parsed = parseMarkdownTable(alignedTable);
      expect(parsed).not.toBeNull();
      expect(parsed?.headers).toEqual(['Left', 'Center', 'Right']);
      expect(parsed?.rows[0]).toEqual(['L1', 'C1', 'R1']);
    });

    it('should parse single dash dividers "| - | - |" correctly (BUG-M1-01)', () => {
      const shortDividerTable = `| Col A | Col B |
| - | - |
| Val A | Val B |`;
      const parsed = parseMarkdownTable(shortDividerTable);
      expect(parsed).not.toBeNull();
      expect(parsed?.headers).toEqual(['Col A', 'Col B']);
      expect(parsed?.rows).toEqual([['Val A', 'Val B']]);
    });

    it('should reject table if divider line is missing dash separators', () => {
      const invalidDivider = `| Header 1 | Header 2 |
| === | === |
| Cell 1 | Cell 2 |`;
      expect(parseMarkdownTable(invalidDivider)).toBeNull();
    });

    it('should handle rows with varying numbers of cells', () => {
      const mismatchedTable = `| Col 1 | Col 2 | Col 3 |
| --- | --- | --- |
| Only One Cell |
| Cell 1 | Cell 2 | Cell 3 | Cell 4 Extra |`;
      const parsed = parseMarkdownTable(mismatchedTable);
      expect(parsed).not.toBeNull();
      expect(parsed?.headers).toEqual(['Col 1', 'Col 2', 'Col 3']);
      expect(parsed?.rows[0]).toEqual(['Only One Cell']);
      expect(parsed?.rows[1]).toEqual(['Cell 1', 'Cell 2', 'Cell 3', 'Cell 4 Extra']);
    });

    it('should format rows to match header length with empty padding', () => {
      const headers = ['A', 'B', 'C'];
      const rows = [['ValA'], ['ValA', 'ValB', 'ValC', 'ExtraVal']];
      const formatted = formatMarkdownTable(headers, rows);
      expect(formatted).toBe(
        '| A | B | C |\n| --- | --- | --- |\n| ValA |  |  |\n| ValA | ValB | ValC |'
      );
    });

    it('should extract tables across mixed document content with Windows (CRLF) and Unix (LF) line endings', () => {
      const doc = "# Title\r\n\r\n| H1 | H2 |\r\n| --- | --- |\r\n| V1 | V2 |\r\n\r\nMiddle Text\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n";
      const extracted = extractMarkdownTables(doc);
      expect(extracted).toHaveLength(2);
      expect(extracted[0].headers).toEqual(['H1', 'H2']);
      expect(extracted[1].headers).toEqual(['A', 'B']);
    });

    it('should return empty array when formatMarkdownTable receives empty headers', () => {
      expect(formatMarkdownTable([], [['cell']])).toBe('');
    });
  });

  describe('2. Complex & Adversarial WikiLinks', () => {
    it('should extract standard WikiLinks', () => {
      const content = 'Check out [[Project Roadmap]] for details.';
      expect(extractWikiLinks(content)).toEqual(['Project Roadmap']);
    });

    it('should strip aliases and extract target note title for [[Note|Alias]] (BUG-M1-04)', () => {
      const content = 'See [[Document Title|Custom Alias]] for more info.';
      const extracted = extractWikiLinks(content);
      expect(extracted).toEqual(['Document Title']);
    });

    it('should extract complex nested path WikiLinks with sections e.g. [[Folder/Subfolder/Note#Section]]', () => {
      const content = 'Refer to [[Docs/Guide/Getting-Started#Installation]] and [[Docs/Guide/Getting-Started#Usage|Usage Guide]].';
      const extracted = extractWikiLinks(content);
      expect(extracted).toEqual([
        'Docs/Guide/Getting-Started#Installation',
        'Docs/Guide/Getting-Started#Usage'
      ]);
    });

    it('should handle unclosed or malformed WikiLinks gracefully', () => {
      const content = 'This is [[ unclosed text and ] single bracket [Test]] end.';
      const extracted = extractWikiLinks(content);
      expect(extracted).toEqual(['unclosed text and ] single bracket [Test']);
    });

    it('should insert WikiLink at cursor when inside an open bracket trigger', () => {
      const text = 'Here is a link [[Doc';
      const cursor = text.length;
      const result = insertWikiLinkAtCursor(text, cursor, 'Documentation');
      expect(result.newContent).toBe('Here is a link [[Documentation]]');
      expect(result.newCursor).toBe('Here is a link [[Documentation]]'.length);
    });

    it('should insert new WikiLink if cursor is NOT in an open bracket prompt', () => {
      const text = 'Plain text cursor ';
      const cursor = text.length;
      const result = insertWikiLinkAtCursor(text, cursor, 'New Note');
      expect(result.newContent).toBe('Plain text cursor [[New Note]]');
      expect(result.newCursor).toBe('Plain text cursor [[New Note]]'.length);
    });

    it('should not overwrite previously closed link on line when inserting WikiLink (BUG-M1-03)', () => {
      const text = '[[Closed Link]] plain text ';
      const cursor = text.length;
      const result = insertWikiLinkAtCursor(text, cursor, 'Target Note');
      expect(result.newContent).toBe('[[Closed Link]] plain text [[Target Note]]');
      expect(result.newCursor).toBe('[[Closed Link]] plain text [[Target Note]]'.length);
    });
  });

  describe('3. Tags Extraction Boundary Tests', () => {
    it('should extract tags with hyphens, underscores, and numbers', () => {
      const text = 'Tags: #v1-release #core_module #2026_goals';
      const tags = extractTags(text);
      expect(tags).toEqual(['v1-release', 'core_module', '2026_goals']);
    });

    it('should ignore markdown headers (e.g. # Heading 1, ## Heading 2)', () => {
      const text = '# Main Title\n## Subtitle\n\nActual #tag1 and #tag2';
      const tags = extractTags(text);
      expect(tags).toEqual(['tag1', 'tag2']);
      expect(tags).not.toContain('Main');
      expect(tags).not.toContain('Subtitle');
    });

    it('should ignore standalone numbers like #123', () => {
      const text = 'Issue #123 is related to #bug-fix';
      const tags = extractTags(text);
      expect(tags).toEqual(['bug-fix']);
    });
  });

  describe('4. Extreme Slash Commands & Selection Formatting', () => {
    it('should replace slash command trigger /table at line end', () => {
      const text = 'Some context line\n/table';
      const cursor = text.length;
      const commandText = '| H1 |\n| --- |\n| C1 |';
      const result = applySlashCommand(text, cursor, commandText);
      expect(result.newContent).toBe('Some context line\n| H1 |\n| --- |\n| C1 |');
      expect(result.newCursor).toBe('Some context line\n| H1 |\n| --- |\n| C1 |'.length);
    });

    it('should append slash command if no / prompt is found before cursor', () => {
      const text = 'Normal line without slash ';
      const cursor = text.length;
      const commandText = '# Header';
      const result = applySlashCommand(text, cursor, commandText);
      expect(result.newContent).toBe('Normal line without slash # Header');
    });

    it('should not match protocol slash in URLs when applying slash commands (BUG-M1-02)', () => {
      const text = 'Visit https://example.com/api';
      const cursor = text.length;
      const commandText = 'REPLACED';
      const result = applySlashCommand(text, cursor, commandText);
      expect(result.newContent).toBe('Visit https://example.com/apiREPLACED');
    });

    it('should apply bold formatting around selected range', () => {
      const text = 'Hello world sample text';
      const start = 6; // 'world'
      const end = 11;
      const result = applyFormattingToSelection(text, start, end, '**', '**');
      expect(result.newContent).toBe('Hello **world** sample text');
      expect(result.newSelectionStart).toBe(8);
      expect(result.newSelectionEnd).toBe(13);
    });

    it('should wrap empty selection (cursor position) with prefix and suffix', () => {
      const text = 'Insert here: ';
      const cursor = text.length;
      const result = applyFormattingToSelection(text, cursor, cursor, '`', '`');
      expect(result.newContent).toBe('Insert here: ``');
      expect(result.newSelectionStart).toBe(14);
      expect(result.newSelectionEnd).toBe(14);
    });

    it('should handle multiline selection formatting', () => {
      const text = 'Line 1\nLine 2';
      const result = applyFormattingToSelection(text, 0, text.length, '```\n', '\n```');
      expect(result.newContent).toBe('```\nLine 1\nLine 2\n```');
    });
  });
});
