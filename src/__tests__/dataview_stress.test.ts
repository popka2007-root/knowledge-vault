import { describe, it, expect } from 'vitest';
import { executeDataviewQuery, parseFrontmatter } from '../modules/dataview/queryEngine';
import { Note, TaskItem } from '../types';

describe('Dataview DQL Engine Boundary & Stress Tests', () => {
  // Mock Dataset for Stress Testing
  const stressNotes: Note[] = [
    {
      id: 'stress-1',
      title: 'Complex Frontmatter Note',
      content: `---
status: active
count: 42
rating: 4.8
isDraft: false
isPublished: true
tags: [alpha, beta, gamma]
categories:
  - work
  - urgent
negativeVal: -15
zeroVal: 0
emptyStr: ""
# Comment line in YAML
unquotedSpecial: status:nested:value
---
# Content Body`,
      folder: 'Inbox/Work',
      tags: ['alpha', 'beta', 'gamma'],
      isEncrypted: false,
      createdAt: 100000,
      updatedAt: 500000,
      isFavorite: true,
      tasks: [
        {
          id: 'st-1',
          noteId: 'stress-1',
          title: 'Task Without Due Date',
          completed: false,
          priority: 'P1',
          createdAt: 1000
        },
        {
          id: 'st-2',
          noteId: 'stress-1',
          title: 'Task With Invalid Date',
          completed: false,
          dueDate: 'invalid-date-string',
          priority: 'P2',
          createdAt: 2000
        }
      ]
    },
    {
      id: 'stress-2',
      title: 'Malformed YAML Header Note',
      content: `---\nstatus: pending\nunclosed yaml header without ending dashes`,
      folder: 'Inbox',
      tags: [],
      isEncrypted: false,
      createdAt: 200000,
      updatedAt: 400000,
      isFavorite: false,
      properties: {
        numericProp: 99,
        boolProp: true,
        arrayProp: ['one', 'two']
      },
      tasks: [
        {
          id: 'st-3',
          noteId: 'stress-2',
          title: '', // Empty title
          completed: true,
          dueDate: '2020-01-01',
          createdAt: 3000
        }
      ]
    },
    {
      id: 'stress-3',
      title: 'Single Line Frontmatter Note',
      content: `--- status: archived, count: 0, isDraft: true ---\nArchived content`,
      folder: 'Archive',
      tags: ['archive'],
      isEncrypted: false,
      createdAt: 300000,
      updatedAt: 300000,
      isFavorite: false
    },
    {
      id: 'stress-4',
      title: 'Cyrillic & Special Chars Note',
      content: `---\nстатус: готово\nприоритет: высокий\n---\nТекст заметки`,
      folder: 'Проекты',
      tags: ['проект', 'важное'],
      isEncrypted: false,
      createdAt: 400000,
      updatedAt: 200000,
      isFavorite: true
    }
  ];

  describe('1. Malformed DQL Queries', () => {
    it('handles null, undefined, or empty query strings without throwing', () => {
      // @ts-ignore
      const resNull = executeDataviewQuery(null, stressNotes);
      expect(resNull.headers).toEqual(['Error']);
      expect(resNull.rows[0][0]).toContain('Empty query string');

      // @ts-ignore
      const resUndef = executeDataviewQuery(undefined, stressNotes);
      expect(resUndef.headers).toEqual(['Error']);

      const resEmpty = executeDataviewQuery('   ', stressNotes);
      expect(resEmpty.headers).toEqual(['Error']);
    });

    it('handles unknown DQL command keywords gracefully', () => {
      const res1 = executeDataviewQuery('SELECT * FROM notes', stressNotes);
      expect(res1.headers).toEqual(['Error']);
      expect(res1.rows[0][0]).toContain('Invalid query syntax');

      // Unknown keyword without valid start keyword or FROM/WHERE returning syntax error
      const res2 = executeDataviewQuery('FOOBAR BAZ', stressNotes);
      expect(res2.headers).toEqual(['Error']);
      expect(res2.rows[0][0]).toContain('Invalid query syntax');

      // Unknown keyword starting string returning syntax error
      const res3 = executeDataviewQuery('DELETE_ALL_DATA', stressNotes);
      expect(res3.headers).toEqual(['Error']);
      expect(res3.rows[0][0]).toContain('Invalid query syntax');
    });

    it('handles missing or invalid FROM targets without throwing', () => {
      // FROM with no target
      const res1 = executeDataviewQuery('TABLE FROM', stressNotes);
      expect(res1.type).toBe('table');
      expect(Array.isArray(res1.rows)).toBe(true);

      // FROM empty quotes
      const res2 = executeDataviewQuery('TABLE FROM ""', stressNotes);
      expect(res2.type).toBe('table');

      // FROM non-existent tag
      const res3 = executeDataviewQuery('TABLE FROM #nonexistent_tag_xyz', stressNotes);
      expect(res3.totalCount).toBe(0);

      // FROM with special characters / injection attempts
      const res4 = executeDataviewQuery('TABLE FROM #tag!@#$%^&*()', stressNotes);
      expect(res4.type).toBe('table');
    });

    it('handles malformed WHERE clauses gracefully', () => {
      // WHERE with unclosed string quotes
      const res1 = executeDataviewQuery('TABLE WHERE status = "active', stressNotes);
      expect(res1.type).toBe('table');

      // WHERE with missing condition operand
      const res2 = executeDataviewQuery('TABLE WHERE status =', stressNotes);
      expect(res2.type).toBe('table');

      // WHERE with chained AND with incomplete parts
      const res3 = executeDataviewQuery('TABLE WHERE status = "active" AND ', stressNotes);
      expect(res3.type).toBe('table');
    });

    it('handles corrupted notes array containing null or undefined elements gracefully by filtering out nulls', () => {
      const corruptedNotes = [stressNotes[0], null as any, undefined as any, stressNotes[1]];
      const res = executeDataviewQuery('TABLE FROM #alpha', corruptedNotes);
      expect(res.type).toBe('table');
      expect(res.totalCount).toBe(1);
      expect(res.rows[0][0]).toBe('Complex Frontmatter Note');
    });
  });

  describe('2. Complex Nested YAML Frontmatter & Property Extraction', () => {
    it('parses array and numeric frontmatter values', () => {
      const content = `---\ncount: 42\nrating: 4.8\nisDraft: false\ntags: [alpha, beta]\n---`;
      const props = parseFrontmatter(content);
      expect(props.count).toBe('42');
      expect(props.rating).toBe('4.8');
      expect(props.isdraft).toBe('false');
      expect(props.tags).toBe('[alpha, beta]');
    });

    it('handles missing YAML closing delimiters without throwing', () => {
      const content = `---\nstatus: active\nkey: value without closing delimiter`;
      const props = parseFrontmatter(content);
      expect(props).toEqual({});
    });

    it('merges existingNote.properties containing native non-string types (booleans, numbers, arrays)', () => {
      const existingProps = {
        active: true,
        score: 100,
        labels: ['dev', 'test']
      };
      const props = parseFrontmatter('No frontmatter here', existingProps);
      expect(props.active).toBe(true);
      expect(props.score).toBe(100);
      expect(props.labels).toEqual(['dev', 'test']);
    });

    it('evaluates WHERE queries on boolean and numeric frontmatter properties', () => {
      const qNum = 'TABLE file.name, count WHERE count = "42"';
      const resNum = executeDataviewQuery(qNum, stressNotes);
      expect(resNum.totalCount).toBe(1);
      expect(resNum.rows[0][0]).toBe('Complex Frontmatter Note');

      const qBool = 'TABLE file.name, isPublished WHERE ispublished = "true"';
      const resBool = executeDataviewQuery(qBool, stressNotes);
      expect(resBool.totalCount).toBe(1);
      expect(resBool.rows[0][0]).toBe('Complex Frontmatter Note');
    });

    it('parses Cyrillic YAML frontmatter properties', () => {
      const content = `---\nстатус: готово\nприоритет: высокий\n---`;
      const props = parseFrontmatter(content);
      expect(props['статус']).toBe('готово');
      expect(props['приоритет']).toBe('высокий');

      const qCyrillic = 'TABLE file.name, статус WHERE статус = "готово"';
      const res = executeDataviewQuery(qCyrillic, stressNotes);
      expect(res.type).toBe('table');
      expect(res.totalCount).toBe(1);
      expect(res.rows[0][0]).toBe('Cyrillic & Special Chars Note');
    });
  });

  describe('3. Extreme SORT and LIMIT Boundary Conditions', () => {
    it('handles LIMIT 0 boundary case (falls back to default 100 limit)', () => {
      const res = executeDataviewQuery('TABLE file.name LIMIT 0', stressNotes);
      expect(res.type).toBe('table');
      expect(res.totalCount).toBe(4);
    });

    it('handles negative LIMIT boundary cases (falls back to default limit)', () => {
      const res = executeDataviewQuery('TABLE file.name LIMIT -5', stressNotes);
      expect(res.type).toBe('table');
      expect(res.totalCount).toBe(4);
    });

    it('handles large LIMIT values beyond dataset size', () => {
      const res = executeDataviewQuery('TABLE file.name LIMIT 999999', stressNotes);
      expect(res.totalCount).toBe(4);
    });

    it('handles SORT clause with missing sort key gracefully', () => {
      const res = executeDataviewQuery('TABLE file.name SORT', stressNotes);
      expect(res.type).toBe('table');
      expect(res.totalCount).toBe(4);
    });

    it('handles SORT by non-existent property without error', () => {
      const res = executeDataviewQuery('TABLE file.name SORT nonexistent_field_123 ASC', stressNotes);
      expect(res.type).toBe('table');
      expect(res.totalCount).toBe(4);
    });

    it('sorts by frontmatter property with mixed defined/undefined values', () => {
      const res = executeDataviewQuery('TABLE file.name, count SORT count DESC', stressNotes);
      expect(res.type).toBe('table');
      expect(res.rows.length).toBe(4);
      expect(res.rows[0][0]).toBe('Complex Frontmatter Note');
    });
  });

  describe('4. TASK Filters with Missing Date & Edge Case Fields', () => {
    const edgeTasks: TaskItem[] = [
      {
        id: 'task-no-date',
        title: 'No Date Task',
        completed: false,
        priority: 'P1',
        createdAt: 1000
      },
      {
        id: 'task-invalid-date',
        title: 'Invalid Date Task',
        completed: false,
        dueDate: 'not-a-valid-date',
        priority: 'P2',
        createdAt: 2000
      },
      {
        id: 'task-no-title',
        title: '',
        completed: true,
        dueDate: '2025-01-01',
        createdAt: 3000
      },
      {
        id: 'task-null-fields',
        title: 'Null Fields Task',
        completed: false,
        dueDate: undefined,
        priority: undefined,
        project: undefined,
        createdAt: 4000
      }
    ];

    it('executes TASK query with missing date fields without throwing', () => {
      const res = executeDataviewQuery('TASK', [], edgeTasks);
      expect(res.type).toBe('table');
      expect(res.headers).toEqual(['Task', 'Status', 'Due Date', 'Priority', 'Project']);
      expect(res.totalCount).toBe(4);

      const noTitleRow = res.rows.find(r => r[0] === 'Untitled Task');
      expect(noTitleRow).toBeDefined();

      const noDateRow = res.rows.find(r => r[0] === 'No Date Task');
      expect(noDateRow).toBeDefined();
      expect(noDateRow![2]).toBe('No Date');
    });

    it('filters TASK query by overdue when tasks have missing or invalid due dates', () => {
      const res = executeDataviewQuery('TASK WHERE overdue', [], edgeTasks);
      expect(res.type).toBe('table');
      for (const row of res.rows) {
        expect(row[2]).not.toBe('No Date');
        expect(row[2]).not.toBe('not-a-valid-date');
      }
    });

    it('filters TASK query by today when tasks have missing due dates', () => {
      const res = executeDataviewQuery('TASK WHERE today', [], edgeTasks);
      expect(res.type).toBe('table');
      expect(res.totalCount).toBe(0);
    });

    it('sorts TASK query by duedate with missing dates handled cleanly', () => {
      const res = executeDataviewQuery('TASK SORT duedate ASC', [], edgeTasks);
      expect(res.type).toBe('table');
      expect(res.rows.length).toBe(4);
      const dates = res.rows.map(r => r[2]);
      expect(dates).toEqual(['2025-01-01', 'not-a-valid-date', 'No Date', 'No Date']);
    });
  });
});
