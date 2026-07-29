import { describe, it, expect } from 'vitest';
import {
  screenToCanvasCoordinates,
  canvasToScreenCoordinates,
  clampZoom,
  calculateConnectorPath
} from '../components/CanvasView';
import {
  getNoteStatus,
  moveNoteToColumn,
  filterKanbanNotes,
  calculateKanbanMetrics,
  KanbanColumnId
} from '../modules/kanban/KanbanView';
import {
  getNodeColor,
  calculateNodeRadius,
  buildGraphData
} from '../components/GraphView';
import {
  formatLocalDate,
  getDaysInMonth,
  getFirstDayOfMonth,
  getNotesForDate,
  getWeekDaysForDate,
  navigateCalendarDate
} from '../modules/calendar/CalendarView';
import { Note } from '../types';

describe('M2 Visualization & Whiteboard Edge Case Stress Testing', () => {

  // =========================================================================
  // 1. CANVAS VIEW: STRESS & BOUNDARY ANALYSIS
  // =========================================================================
  describe('Canvas View: Coordinate Overflow, Zoom & Pan Bounds, Overlap', () => {

    it('handles extreme coordinate values without precision breakdown', () => {
      const extremeScreenX = 1e12;
      const extremeScreenY = -1e12;
      const panX = 5e11;
      const panY = -5e11;
      const zoom = 2.0;

      const canvasCoords = screenToCanvasCoordinates(extremeScreenX, extremeScreenY, panX, panY, zoom);
      expect(canvasCoords.x).toBe((1e12 - 5e11) / 2.0); // 2.5e11
      expect(canvasCoords.y).toBe((-1e12 - (-5e11)) / 2.0); // -2.5e11
      expect(Number.isFinite(canvasCoords.x)).toBe(true);
      expect(Number.isFinite(canvasCoords.y)).toBe(true);
    });

    it('maintains mathematical roundtrip symmetry under extreme zoom and pan', () => {
      const originalCanvasX = 987654.321;
      const originalCanvasY = -123456.789;
      const panX = -999999;
      const panY = 888888;
      const zoom = 2.75;

      const screenCoords = canvasToScreenCoordinates(originalCanvasX, originalCanvasY, panX, panY, zoom);
      const reconstructedCanvasCoords = screenToCanvasCoordinates(screenCoords.x, screenCoords.y, panX, panY, zoom);

      expect(reconstructedCanvasCoords.x).toBeCloseTo(originalCanvasX, 5);
      expect(reconstructedCanvasCoords.y).toBeCloseTo(originalCanvasY, 5);
    });

    it('handles zero zoom division edge cases in coordinate transformations', () => {
      const canvasCoords = screenToCanvasCoordinates(100, 200, 10, 20, 0);
      expect(canvasCoords.x).toBe(Infinity);
      expect(canvasCoords.y).toBe(Infinity);
    });

    it('clamps zoom strictly within limits (0.1 to 3.0 range tests)', () => {
      // Default limits: min 0.2, max 2.5
      expect(clampZoom(0.1)).toBe(0.2);
      expect(clampZoom(3.0)).toBe(2.5);
      expect(clampZoom(0.0001)).toBe(0.2);
      expect(clampZoom(9999)).toBe(2.5);
      expect(clampZoom(-5)).toBe(0.2);

      // Custom custom limits (0.1 to 3.0)
      expect(clampZoom(0.05, 0.1, 3.0)).toBe(0.1);
      expect(clampZoom(0.1, 0.1, 3.0)).toBe(0.1);
      expect(clampZoom(1.5, 0.1, 3.0)).toBe(1.5);
      expect(clampZoom(3.0, 0.1, 3.0)).toBe(3.0);
      expect(clampZoom(3.5, 0.1, 3.0)).toBe(3.0);
    });

    it('calculates connector paths for 100% overlapping nodes', () => {
      const nodeA = { x: 100, y: 100, width: 200, height: 100 };
      const nodeB = { x: 100, y: 100, width: 200, height: 100 };

      const result = calculateConnectorPath(nodeA, nodeB, 1, { x: 0, y: 0 });
      expect(result.startX).toBe(200);
      expect(result.startY).toBe(150);
      expect(result.endX).toBe(200);
      expect(result.endY).toBe(150);
      expect(result.pathData).not.toContain('NaN');
      expect(result.pathData).toBe('M 200,150 C 200,150 200,150 200,150');
    });

    it('calculates connector paths for nested/enclosed nodes and zero-size nodes', () => {
      const outerNode = { x: 0, y: 0, width: 500, height: 500 };
      const innerNode = { x: 200, y: 200, width: 0, height: 0 };

      const result = calculateConnectorPath(outerNode, innerNode, 1.5, { x: 50, y: 25 });
      // Outer center = (250, 250) * 1.5 + (50, 25) = (425, 400)
      // Inner center = (200, 200) * 1.5 + (50, 25) = (350, 325)
      expect(result.startX).toBe(425);
      expect(result.startY).toBe(400);
      expect(result.endX).toBe(350);
      expect(result.endY).toBe(325);
      expect(result.pathData).toMatch(/^M 425,400 C \d+(\.\d+)?,400 \d+(\.\d+)?,325 350,325$/);
      expect(result.pathData).not.toContain('NaN');
    });

    it('handles negative dimensions gracefully in connector math', () => {
      const nodeA = { x: 100, y: 100, width: -100, height: -50 };
      const nodeB = { x: 300, y: 300, width: 100, height: 100 };

      const result = calculateConnectorPath(nodeA, nodeB);
      expect(result.startX).toBe(50);
      expect(result.startY).toBe(75);
      expect(result.pathData).not.toContain('NaN');
    });
  });

  // =========================================================================
  // 2. KANBAN VIEW: INVALID TARGETS, MISSING STATUS, EMPTY DRAG
  // =========================================================================
  describe('Kanban View: Invalid Column Targets, Missing Properties, Drag & Metrics', () => {
    const baseNote: Note = {
      id: 'test-note-1',
      title: 'Base Test Note',
      content: 'Sample content for testing',
      folder: 'root',
      tags: ['test'],
      isEncrypted: false,
      createdAt: 100000,
      updatedAt: 100000,
      isFavorite: false
    };

    it('handles movement to invalid/unknown column target strings', () => {
      const invalidCol = 'invalid_column_target' as KanbanColumnId;
      const updated = moveNoteToColumn(baseNote, invalidCol);

      expect(updated.status).toBe('invalid_column_target');
      expect(updated.kanbanStatus).toBe('invalid_column_target');
      expect(updated.updatedAt).toBeGreaterThan(baseNote.updatedAt);
    });

    it('infers status correctly when status property is missing or null', () => {
      const noteWithoutStatus: Note = { ...baseNote };
      delete (noteWithoutStatus as any).status;
      delete (noteWithoutStatus as any).kanbanStatus;

      // 1. Default fallback -> backlog
      expect(getNoteStatus(noteWithoutStatus)).toBe('backlog');

      // 2. Favorite fallback -> todo
      const favNote = { ...noteWithoutStatus, isFavorite: true };
      expect(getNoteStatus(favNote)).toBe('todo');

      // 3. Some completed tasks fallback -> in_progress
      const partialTaskNote: Note = {
        ...noteWithoutStatus,
        tasks: [
          { id: 't1', title: 'Task 1', completed: true, createdAt: 100 },
          { id: 't2', title: 'Task 2', completed: false, createdAt: 100 }
        ]
      };
      expect(getNoteStatus(partialTaskNote)).toBe('in_progress');

      // 4. All completed tasks fallback -> done
      const completedTaskNote: Note = {
        ...noteWithoutStatus,
        tasks: [
          { id: 't1', title: 'Task 1', completed: true, createdAt: 100 },
          { id: 't2', title: 'Task 2', completed: true, createdAt: 100 }
        ]
      };
      expect(getNoteStatus(completedTaskNote)).toBe('done');
    });

    it('respects task completion precedence over favorite flag when inferring status', () => {
      const conflictingNote: Note = {
        ...baseNote,
        isFavorite: true,
        tasks: [
          { id: 't1', title: 'Task 1', completed: true, createdAt: 100 }
        ]
      };
      // All tasks completed -> should infer 'done' over 'todo' (favorite)
      expect(getNoteStatus(conflictingNote)).toBe('done');
    });

    it('calculates metrics safely on empty note list without division by zero', () => {
      const metrics = calculateKanbanMetrics([]);
      expect(metrics.totalNotes).toBe(0);
      expect(metrics.backlogCount).toBe(0);
      expect(metrics.todoCount).toBe(0);
      expect(metrics.inProgressCount).toBe(0);
      expect(metrics.doneCount).toBe(0);
      expect(metrics.completionPercentage).toBe(0); // must be 0, not NaN
      expect(metrics.totalTasks).toBe(0);
      expect(metrics.completedTasks).toBe(0);
      expect(metrics.taskProgressPercentage).toBe(0); // must be 0, not NaN
    });

    it('filters kanban notes cleanly on empty list or special regex characters in search', () => {
      expect(filterKanbanNotes([], 'backlog', '', 'all')).toEqual([]);

      const notes: Note[] = [
        { ...baseNote, title: 'Special [Regex] * (Query) Note', status: 'todo' }
      ];

      const resRegex = filterKanbanNotes(notes, 'todo', '[Regex] *', 'all');
      expect(resRegex.length).toBe(1);
      expect(resRegex[0].id).toBe('test-note-1');

      const resNotFound = filterKanbanNotes(notes, 'todo', 'nonexistent', 'all');
      expect(resNotFound.length).toBe(0);
    });

    it('handles notes with undefined tags array when filtering by tag', () => {
      const noteNoTags: Note = { ...baseNote, status: 'backlog', tags: undefined as any };
      const resAll = filterKanbanNotes([noteNoTags], 'backlog', '', 'all');
      expect(resAll.length).toBe(1);

      const resTag = filterKanbanNotes([noteNoTags], 'backlog', '', 'specific-tag');
      expect(resTag.length).toBe(0);
    });
  });

  // =========================================================================
  // 3. GRAPH SIMULATION: 0 NODES, 1 NODE, ISOLATED CLUSTERS, CIRCULAR LINKS
  // =========================================================================
  describe('Graph Simulation: Node Scaling, Graph Topology & Link Extraction', () => {

    it('builds graph data safely for 0 nodes', () => {
      const { nodes, links, adjacencyList } = buildGraphData([]);
      expect(nodes).toEqual([]);
      expect(links).toEqual([]);
      expect(adjacencyList.size).toBe(0);
    });

    it('builds graph data safely for 1 single node', () => {
      const singleNote: Note = {
        id: 'solo-1',
        title: 'Solo Note',
        content: 'No connections here',
        folder: 'root',
        tags: [],
        isEncrypted: false,
        createdAt: 1000,
        updatedAt: 1000,
        isFavorite: false
      };

      const { nodes, links, adjacencyList } = buildGraphData([singleNote]);
      expect(nodes.length).toBe(1);
      expect(nodes[0].id).toBe('solo-1');
      expect(nodes[0].linkCount).toBe(0);
      expect(nodes[0].radius).toBe(6);
      expect(links).toEqual([]);
      expect(adjacencyList.get('solo-1')?.size).toBe(0);
    });

    it('handles isolated node clusters independently', () => {
      const clusterNotes: Note[] = [
        // Cluster A
        { id: 'a1', title: 'Alpha 1', content: 'Links to [[Alpha 2]]', folder: '', tags: [], isEncrypted: false, createdAt: 1, updatedAt: 1, isFavorite: false },
        { id: 'a2', title: 'Alpha 2', content: 'Belongs to Cluster A', folder: '', tags: [], isEncrypted: false, createdAt: 1, updatedAt: 1, isFavorite: false },
        // Cluster B
        { id: 'b1', title: 'Beta 1', content: 'Links to [[Beta 2]]', folder: '', tags: [], isEncrypted: false, createdAt: 1, updatedAt: 1, isFavorite: false },
        { id: 'b2', title: 'Beta 2', content: 'Belongs to Cluster B', folder: '', tags: [], isEncrypted: false, createdAt: 1, updatedAt: 1, isFavorite: false },
        // Standalone Isolated Note
        { id: 'c1', title: 'Gamma 1', content: 'Isolated note', folder: '', tags: [], isEncrypted: false, createdAt: 1, updatedAt: 1, isFavorite: false },
      ];

      const { nodes, links, adjacencyList } = buildGraphData(clusterNotes);
      expect(nodes.length).toBe(5);
      expect(links.length).toBe(2);

      const a1Neighbors = adjacencyList.get('a1');
      expect(a1Neighbors?.has('a2')).toBe(true);
      expect(a1Neighbors?.has('b1')).toBe(false);

      const c1Node = nodes.find(n => n.id === 'c1');
      expect(c1Node?.linkCount).toBe(0);
    });

    it('handles circular link graphs (A -> B -> C -> A) and deduplicates bidirectional links', () => {
      const circularNotes: Note[] = [
        { id: 'n-a', title: 'Node A', content: 'Links to [[Node B]]', folder: '', tags: [], isEncrypted: false, createdAt: 1, updatedAt: 1, isFavorite: false },
        { id: 'n-b', title: 'Node B', content: 'Links to [[Node C]]', folder: '', tags: [], isEncrypted: false, createdAt: 1, updatedAt: 1, isFavorite: false },
        { id: 'n-c', title: 'Node C', content: 'Links to [[Node A]]', folder: '', tags: [], isEncrypted: false, createdAt: 1, updatedAt: 1, isFavorite: false },
      ];

      const { nodes, links, adjacencyList } = buildGraphData(circularNotes);
      expect(nodes.length).toBe(3);
      expect(links.length).toBe(3);

      nodes.forEach(n => {
        expect(n.linkCount).toBe(2); // In undirected view, each node is connected to 2 neighbors
        expect(adjacencyList.get(n.id)?.size).toBe(2);
      });
    });

    it('handles self-referencing links, duplicate text references, and whitespace/case variations', () => {
      const edgeNotes: Note[] = [
        {
          id: 'self-1',
          title: 'Self Note',
          content: 'I link to [[Self Note]] and [[ Target Note ]] multiple times [[target note]]!',
          folder: '', tags: [], isEncrypted: false, createdAt: 1, updatedAt: 1, isFavorite: false
        },
        {
          id: 'target-1',
          title: 'Target Note',
          content: 'Target content',
          folder: '', tags: [], isEncrypted: false, createdAt: 1, updatedAt: 1, isFavorite: false
        }
      ];

      const { nodes, links } = buildGraphData(edgeNotes);
      // Link between self-1 and target-1 should only be created ONCE despite duplicate references
      const targetLinks = links.filter(l =>
        (l.source === 'self-1' && l.target === 'target-1') ||
        (l.source === 'target-1' && l.target === 'self-1')
      );
      expect(targetLinks.length).toBe(1);
    });
  });

  // =========================================================================
  // 4. CALENDAR VIEW: LEAP YEARS, MONTH ROLLOVER, EMPTY NOTES
  // =========================================================================
  describe('Calendar View: Leap Years, Month/Year Rollover, Date Note Querying', () => {

    it('accurately identifies leap year February days count across multiple leap cycles', () => {
      // Leap years
      expect(getDaysInMonth(2024, 1)).toBe(29);
      expect(getDaysInMonth(2028, 1)).toBe(29);
      expect(getDaysInMonth(2000, 1)).toBe(29); // Century leap year

      // Non-leap years
      expect(getDaysInMonth(2026, 1)).toBe(28);
      expect(getDaysInMonth(2025, 1)).toBe(28);
      expect(getDaysInMonth(2100, 1)).toBe(28); // Century non-leap year
    });

    it('handles leap day (Feb 29) note queries correctly', () => {
      const leapDayTs = new Date(2024, 1, 29, 14, 30, 0).getTime(); // 2024-02-29
      const leapNote: Note = {
        id: 'leap-note',
        title: 'Leap Day Event',
        content: 'Occurs once every 4 years',
        folder: '', tags: [], isEncrypted: false,
        createdAt: leapDayTs, updatedAt: leapDayTs, isFavorite: false
      };

      const matchedNotes = getNotesForDate([leapNote], '2024-02-29');
      expect(matchedNotes.length).toBe(1);
      expect(matchedNotes[0].id).toBe('leap-note');
    });

    it('executes month and year rollover correctly when navigating across boundaries', () => {
      // Dec -> Jan (Year increment)
      const decDate = new Date(2026, 11, 15); // Dec 15, 2026
      const janNextYear = navigateCalendarDate(decDate, 'month', 1);
      expect(janNextYear.getFullYear()).toBe(2027);
      expect(janNextYear.getMonth()).toBe(0);

      // Jan -> Dec (Year decrement)
      const janDate = new Date(2027, 0, 10); // Jan 10, 2027
      const decPrevYear = navigateCalendarDate(janDate, 'month', -1);
      expect(decPrevYear.getFullYear()).toBe(2026);
      expect(decPrevYear.getMonth()).toBe(11);

      // Week navigation spanning Dec 31 -> Jan 1
      const yearEndWeek = getWeekDaysForDate(new Date(2026, 11, 31)); // Dec 31, 2026 (Thu)
      expect(yearEndWeek.length).toBe(7);
      expect(yearEndWeek[0].dateStr).toBe('2026-12-27'); // Sunday
      expect(yearEndWeek[4].dateStr).toBe('2026-12-31'); // Thursday
      expect(yearEndWeek[5].dateStr).toBe('2027-01-01'); // Friday (New Year!)
    });

    it('returns empty array when querying dates with zero notes', () => {
      const sampleNotes: Note[] = [
        {
          id: 'n1', title: 'Note 1', content: '', folder: '', tags: [], isEncrypted: false,
          createdAt: new Date(2026, 6, 29).getTime(), updatedAt: 0, isFavorite: false
        }
      ];

      expect(getNotesForDate(sampleNotes, '2099-01-01')).toEqual([]);
      expect(getNotesForDate([], '2026-07-29')).toEqual([]);
    });

    it('correctly matches notes created at day start (00:00:00) and day end (23:59:59)', () => {
      const startOfDayTs = new Date(2026, 6, 29, 0, 0, 0, 0).getTime();
      const endOfDayTs = new Date(2026, 6, 29, 23, 59, 59, 999).getTime();

      const notes: Note[] = [
        { id: 'start-note', title: 'Start', content: '', folder: '', tags: [], isEncrypted: false, createdAt: startOfDayTs, updatedAt: 0, isFavorite: false },
        { id: 'end-note', title: 'End', content: '', folder: '', tags: [], isEncrypted: false, createdAt: endOfDayTs, updatedAt: 0, isFavorite: false }
      ];

      const res = getNotesForDate(notes, '2026-07-29');
      expect(res.length).toBe(2);
      expect(res.map(n => n.id)).toEqual(['start-note', 'end-note']);
    });
  });

});
