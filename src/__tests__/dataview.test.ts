import { describe, it, expect } from 'vitest';
import { executeDataviewQuery, parseFrontmatter } from '../modules/dataview/queryEngine';
import { Note } from '../types';

describe('Dataview DQL Parser & Execution Engine', () => {
  const sampleNotes: Note[] = [
    {
      id: 'note-1',
      title: 'Alpha Project',
      content: '---\nstatus: active\npriority: high\nauthor: Alice\n---\n# Alpha Project Note',
      folder: 'Projects',
      tags: ['project', 'work'],
      isEncrypted: false,
      createdAt: 1000,
      updatedAt: 5000,
      isFavorite: true,
      tasks: [
        {
          id: 'task-1',
          noteId: 'note-1',
          title: 'Review Alpha Architecture',
          completed: false,
          dueDate: '2020-01-01', // Overdue
          priority: 'P1',
          project: 'Alpha',
          createdAt: 1000
        },
        {
          id: 'task-2',
          noteId: 'note-1',
          title: 'Publish Alpha v1.0',
          completed: true,
          dueDate: '2026-12-31',
          priority: 'P2',
          project: 'Alpha',
          createdAt: 1000
        }
      ]
    },
    {
      id: 'note-2',
      title: 'Beta System',
      content: '--- status: active, priority: medium, author: Bob ---\nBeta System Specs',
      folder: 'Projects',
      tags: ['project', 'tech'],
      isEncrypted: false,
      createdAt: 2000,
      updatedAt: 4000,
      isFavorite: false,
      tasks: [
        {
          id: 'task-3',
          noteId: 'note-2',
          title: 'Setup Beta CI/CD',
          completed: false,
          dueDate: '2029-01-01', // Pending future
          priority: 'P1',
          project: 'Beta',
          createdAt: 2000
        }
      ]
    },
    {
      id: 'note-3',
      title: 'Gamma Archive',
      content: '---\nstatus: archived\npriority: low\n---\nGamma Docs',
      folder: 'Archive',
      tags: ['archive'],
      isEncrypted: false,
      createdAt: 3000,
      updatedAt: 3000,
      isFavorite: false
    }
  ];

  describe('parseFrontmatter', () => {
    it('parses multiline YAML frontmatter blocks correctly', () => {
      const content = '---\nstatus: active\npriority: high\nauthor: Alice\n---\n# Title';
      const props = parseFrontmatter(content);
      expect(props.status).toBe('active');
      expect(props.priority).toBe('high');
      expect(props.author).toBe('Alice');
    });

    it('parses single-line header format (--- key: val, key2: val2 ---)', () => {
      const content = '--- status: active, priority: medium, author: Bob ---\nSome note text';
      const props = parseFrontmatter(content);
      expect(props.status).toBe('active');
      expect(props.priority).toBe('medium');
      expect(props.author).toBe('Bob');
    });

    it('merges existing note properties object', () => {
      const content = 'Plain content without frontmatter';
      const props = parseFrontmatter(content, { customKey: 'customVal' });
      expect(props.customkey).toBe('customVal');
      expect(props.customKey).toBe('customVal');
    });
  });

  describe('TABLE Queries & Frontmatter Extraction', () => {
    it('executes simple TABLE query and returns title, last modified, and tags', () => {
      const query = 'TABLE FROM #project';
      const res = executeDataviewQuery(query, sampleNotes);
      expect(res.type).toBe('table');
      expect(res.totalCount).toBe(2);
      expect(res.headers).toEqual(['Title', 'Last Modified', 'Tags']);
      const titles = res.rows.map(r => r[0]);
      expect(titles).toContain('Alpha Project');
      expect(titles).toContain('Beta System');
    });

    it('extracts custom dynamic frontmatter fields in TABLE queries', () => {
      const query = 'TABLE file.name, status, priority, author FROM #project';
      const res = executeDataviewQuery(query, sampleNotes);
      expect(res.type).toBe('table');
      expect(res.headers).toEqual(['Title', 'status', 'priority', 'author']);
      expect(res.totalCount).toBe(2);

      // Find Alpha Project row
      const alphaRow = res.rows.find(r => r[0] === 'Alpha Project');
      expect(alphaRow).toBeDefined();
      expect(alphaRow![1]).toBe('active');
      expect(alphaRow![2]).toBe('high');
      expect(alphaRow![3]).toBe('Alice');

      // Find Beta System row
      const betaRow = res.rows.find(r => r[0] === 'Beta System');
      expect(betaRow).toBeDefined();
      expect(betaRow![1]).toBe('active');
      expect(betaRow![2]).toBe('medium');
      expect(betaRow![3]).toBe('Bob');
    });

    it('filters notes using WHERE clauses on frontmatter properties', () => {
      const query = 'TABLE file.name, status WHERE status = "archived"';
      const res = executeDataviewQuery(query, sampleNotes);
      expect(res.totalCount).toBe(1);
      expect(res.rows[0][0]).toBe('Gamma Archive');
      expect(res.rows[0][1]).toBe('archived');
    });
  });

  describe('LIST Queries', () => {
    it('executes LIST queries returning formatted file list', () => {
      const query = 'LIST FROM #project';
      const res = executeDataviewQuery(query, sampleNotes);
      expect(res.type).toBe('list');
      expect(res.headers).toEqual(['File']);
      expect(res.totalCount).toBe(2);
      const titles = res.rows.map(r => r[0]);
      expect(titles).toEqual(['Alpha Project', 'Beta System']);
    });
  });

  describe('TASK Queries & Status Filtering', () => {
    it('executes TASK query returning all aggregated tasks', () => {
      const query = 'TASK';
      const res = executeDataviewQuery(query, sampleNotes);
      expect(res.type).toBe('table');
      expect(res.headers).toEqual(['Task', 'Status', 'Due Date', 'Priority', 'Project']);
      expect(res.totalCount).toBe(3);
    });

    it('filters TASK queries by overdue status', () => {
      const query = 'TASK WHERE overdue';
      const res = executeDataviewQuery(query, sampleNotes);
      expect(res.totalCount).toBe(1);
      expect(res.rows[0][0]).toBe('Review Alpha Architecture');
      expect(res.rows[0][1]).toBe('⏳ Pending');
    });

    it('filters TASK queries by completed status', () => {
      const query = 'TASK WHERE completed';
      const res = executeDataviewQuery(query, sampleNotes);
      expect(res.totalCount).toBe(1);
      expect(res.rows[0][0]).toBe('Publish Alpha v1.0');
      expect(res.rows[0][1]).toBe('✅ Done');
    });

    it('filters TASK queries by pending status', () => {
      const query = 'TASK WHERE pending';
      const res = executeDataviewQuery(query, sampleNotes);
      expect(res.totalCount).toBe(2); // task-1 and task-3
      const taskTitles = res.rows.map(r => r[0]);
      expect(taskTitles).toContain('Review Alpha Architecture');
      expect(taskTitles).toContain('Setup Beta CI/CD');
    });
  });

  describe('SORT and LIMIT Clauses', () => {
    it('sorts notes by file.name ASC and DESC', () => {
      const queryAsc = 'TABLE file.name SORT file.name ASC';
      const resAsc = executeDataviewQuery(queryAsc, sampleNotes);
      expect(resAsc.rows.map(r => r[0])).toEqual(['Alpha Project', 'Beta System', 'Gamma Archive']);

      const queryDesc = 'TABLE file.name SORT file.name DESC';
      const resDesc = executeDataviewQuery(queryDesc, sampleNotes);
      expect(resDesc.rows.map(r => r[0])).toEqual(['Gamma Archive', 'Beta System', 'Alpha Project']);
    });

    it('respects LIMIT clause', () => {
      const query = 'TABLE file.name SORT file.name ASC LIMIT 2';
      const res = executeDataviewQuery(query, sampleNotes);
      expect(res.totalCount).toBe(2);
      expect(res.rows.map(r => r[0])).toEqual(['Alpha Project', 'Beta System']);
    });
  });

  describe('Invalid Query Handling', () => {
    it('handles empty or blank query gracefully', () => {
      const res = executeDataviewQuery('', sampleNotes);
      expect(res.headers).toEqual(['Error']);
      expect(res.rows[0][0]).toContain('Empty query string');
    });

    it('handles unknown/malformed query commands gracefully without throwing', () => {
      const res = executeDataviewQuery('INVALIDQUERYCOMMAND foobar', sampleNotes);
      expect(res.headers).toEqual(['Error']);
      expect(res.rows[0][0]).toContain('Invalid query syntax');
    });
  });
});
