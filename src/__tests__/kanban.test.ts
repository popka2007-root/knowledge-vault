import { describe, it, expect } from 'vitest';
import {
  getNoteStatus,
  moveNoteToColumn,
  filterKanbanNotes,
  calculateKanbanMetrics,
  KanbanColumnId
} from '../modules/kanban/KanbanView';
import { Note } from '../types';

describe('Kanban Unit Tests: Card Movement, Filters & Metrics', () => {
  const sampleNotes: Note[] = [
    {
      id: 'note-1',
      title: 'Backlog Item',
      content: 'Brainstorming new features for vault',
      folder: 'default',
      tags: ['planning', 'feature'],
      isEncrypted: false,
      createdAt: 1000,
      updatedAt: 1000,
      isFavorite: false,
      status: 'backlog'
    },
    {
      id: 'note-2',
      title: 'To Do Item',
      content: 'Design modern dark UI mockup',
      folder: 'design',
      tags: ['ui', 'feature'],
      isEncrypted: false,
      createdAt: 2000,
      updatedAt: 2000,
      isFavorite: true,
      status: 'todo'
    },
    {
      id: 'note-3',
      title: 'In Progress Item',
      content: 'Building Kanban view with drag and drop',
      folder: 'dev',
      tags: ['dev', 'kanban'],
      isEncrypted: false,
      createdAt: 3000,
      updatedAt: 3000,
      isFavorite: false,
      status: 'in_progress',
      tasks: [
        { id: 't1', title: 'Setup grid', completed: true, createdAt: 3000 },
        { id: 't2', title: 'Add DnD handlers', completed: false, createdAt: 3000 }
      ]
    },
    {
      id: 'note-4',
      title: 'Completed Item',
      content: 'Testing Vitest test suite',
      folder: 'test',
      tags: ['qa'],
      isEncrypted: false,
      createdAt: 4000,
      updatedAt: 4000,
      isFavorite: false,
      status: 'done',
      tasks: [
        { id: 't3', title: 'Write tests', completed: true, createdAt: 4000 }
      ]
    },
    {
      id: 'note-5',
      title: 'Inferred Status Item',
      content: 'Note without explicit status property',
      folder: 'default',
      tags: ['inferred'],
      isEncrypted: false,
      createdAt: 5000,
      updatedAt: 5000,
      isFavorite: false,
      tasks: [
        { id: 't4', title: 'Task 1', completed: true, createdAt: 5000 },
        { id: 't5', title: 'Task 2', completed: true, createdAt: 5000 }
      ]
    }
  ];

  describe('getNoteStatus', () => {
    it('returns explicit status if defined on note', () => {
      expect(getNoteStatus(sampleNotes[0])).toBe('backlog');
      expect(getNoteStatus(sampleNotes[1])).toBe('todo');
      expect(getNoteStatus(sampleNotes[2])).toBe('in_progress');
      expect(getNoteStatus(sampleNotes[3])).toBe('done');
    });

    it('infers done status if all tasks are completed and no explicit status is set', () => {
      expect(getNoteStatus(sampleNotes[4])).toBe('done');
    });

    it('infers in_progress status if some tasks are completed', () => {
      const note: Note = {
        ...sampleNotes[0],
        status: undefined as any,
        tasks: [
          { id: 't1', title: 'Subtask A', completed: true, createdAt: 100 },
          { id: 't2', title: 'Subtask B', completed: false, createdAt: 100 }
        ]
      };
      expect(getNoteStatus(note)).toBe('in_progress');
    });

    it('infers todo status if note is favorite', () => {
      const note: Note = {
        ...sampleNotes[0],
        status: undefined as any,
        isFavorite: true
      };
      expect(getNoteStatus(note)).toBe('todo');
    });

    it('defaults to backlog status when no other rules match', () => {
      const note: Note = {
        ...sampleNotes[0],
        status: undefined as any,
        isFavorite: false,
        tasks: []
      };
      expect(getNoteStatus(note)).toBe('backlog');
    });
  });

  describe('moveNoteToColumn', () => {
    it('moves card from backlog to in_progress with state persistence', () => {
      const updated = moveNoteToColumn(sampleNotes[0], 'in_progress');
      expect(updated.status).toBe('in_progress');
      expect((updated as any).kanbanStatus).toBe('in_progress');
      expect(updated.updatedAt).toBeGreaterThan(sampleNotes[0].updatedAt);
    });

    it('marks all subtasks completed when card is moved to done column', () => {
      const updated = moveNoteToColumn(sampleNotes[2], 'done');
      expect(updated.status).toBe('done');
      expect(updated.tasks?.every(t => t.completed)).toBe(true);
    });

    it('resets subtasks to uncompleted when card is moved to backlog column', () => {
      const updated = moveNoteToColumn(sampleNotes[3], 'backlog');
      expect(updated.status).toBe('backlog');
      expect(updated.tasks?.every(t => !t.completed)).toBe(true);
    });
  });

  describe('filterKanbanNotes', () => {
    it('filters notes belonging to specific column status', () => {
      const backlogItems = filterKanbanNotes(sampleNotes, 'backlog', '', 'all');
      expect(backlogItems.map(n => n.id)).toEqual(['note-1']);

      const doneItems = filterKanbanNotes(sampleNotes, 'done', '', 'all');
      expect(doneItems.map(n => n.id)).toEqual(['note-4', 'note-5']);
    });

    it('filters notes by search query in title or content', () => {
      const filtered = filterKanbanNotes(sampleNotes, 'todo', 'dark UI', 'all');
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('note-2');
    });

    it('filters notes by tag', () => {
      const filtered = filterKanbanNotes(sampleNotes, 'todo', '', 'ui');
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('note-2');
    });

    it('excludes deleted notes', () => {
      const notesWithDeleted = [
        ...sampleNotes,
        { ...sampleNotes[0], id: 'deleted-note', isDeleted: true }
      ];
      const backlogItems = filterKanbanNotes(notesWithDeleted, 'backlog', '', 'all');
      expect(backlogItems.find(n => n.id === 'deleted-note')).toBeUndefined();
    });
  });

  describe('calculateKanbanMetrics', () => {
    it('calculates card counts and progress percentages accurately', () => {
      const metrics = calculateKanbanMetrics(sampleNotes);
      expect(metrics.totalNotes).toBe(5);
      expect(metrics.backlogCount).toBe(1);
      expect(metrics.todoCount).toBe(1);
      expect(metrics.inProgressCount).toBe(1);
      expect(metrics.doneCount).toBe(2);
      expect(metrics.completionPercentage).toBe(40); // 2 / 5 = 40%
      expect(metrics.totalTasks).toBe(5); // 2 + 1 + 2 = 5
      expect(metrics.completedTasks).toBe(4); // 1 + 1 + 2 = 4
      expect(metrics.taskProgressPercentage).toBe(80); // 4 / 5 = 80%
    });
  });
});
