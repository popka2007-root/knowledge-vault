import { describe, it, expect } from 'vitest';
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

describe('Visualization Unit Tests: D3 Knowledge Graph & Calendar View', () => {
  describe('D3 Knowledge Graph View', () => {
    const sampleNotes: Note[] = [
      {
        id: 'note-a',
        title: 'Project Architecture',
        content: 'Overview of [[Database Schema]] and [[Security Vault]]',
        folder: 'root',
        tags: ['architecture'],
        isEncrypted: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isFavorite: true
      },
      {
        id: 'note-b',
        title: 'Database Schema',
        content: 'Postgres & SQLite integration details',
        folder: 'root',
        tags: ['database'],
        isEncrypted: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isFavorite: false
      },
      {
        id: 'note-c',
        title: 'Security Vault',
        content: 'AES-256 client side E2EE link to [[Project Architecture]]',
        folder: 'root',
        tags: ['security'],
        isEncrypted: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isFavorite: false
      },
      {
        id: 'note-d',
        title: 'Standalone Note',
        content: 'No wiki links here',
        folder: 'root',
        tags: [],
        isEncrypted: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isFavorite: false
      }
    ];

    it('getNodeColor returns deterministic tag color from first tag', () => {
      const color1 = getNodeColor(sampleNotes[0], 0);
      const color2 = getNodeColor(sampleNotes[0], 5);
      expect(color1).toBe(color2); // Tag hash determines color regardless of index
    });

    it('getNodeColor falls back to index palette when note has no tags', () => {
      const color = getNodeColor(sampleNotes[3], 2);
      expect(color).toBeDefined();
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('calculateNodeRadius scales radius with degree link count within bounds [6, 20]', () => {
      expect(calculateNodeRadius(0)).toBe(6);
      expect(calculateNodeRadius(1)).toBe(8);
      expect(calculateNodeRadius(3)).toBe(12);
      expect(calculateNodeRadius(10)).toBe(20);
      expect(calculateNodeRadius(100)).toBe(20); // max bound
    });

    it('buildGraphData extracts wiki links and builds nodes, links & adjacency list', () => {
      const { nodes, links, adjacencyList } = buildGraphData(sampleNotes);

      expect(nodes.length).toBe(4);
      expect(links.length).toBe(2); // (Architecture -> DB), (Architecture -> Security)

      const archNode = nodes.find(n => n.id === 'note-a');
      expect(archNode?.linkCount).toBe(2);
      expect(archNode?.radius).toBe(10); // 6 + 2*2 = 10

      const standaloneNode = nodes.find(n => n.id === 'note-d');
      expect(standaloneNode?.linkCount).toBe(0);
      expect(standaloneNode?.radius).toBe(6);

      // Verify adjacency mapping
      const archNeighbors = adjacencyList.get('note-a');
      expect(archNeighbors?.has('note-b')).toBe(true);
      expect(archNeighbors?.has('note-c')).toBe(true);
    });

    it('buildGraphData prevents duplicate link objects between same note pairs', () => {
      // note-a links to note-c AND note-c links back to note-a
      const { links } = buildGraphData(sampleNotes);
      const linksBetweenAC = links.filter(l =>
        (l.source === 'note-a' && l.target === 'note-c') ||
        (l.source === 'note-c' && l.target === 'note-a')
      );
      expect(linksBetweenAC.length).toBe(1);
    });
  });

  describe('Calendar View', () => {
    it('formatLocalDate formats date accurately as YYYY-MM-DD', () => {
      const date = new Date(2026, 6, 29); // 2026-07-29
      expect(formatLocalDate(date)).toBe('2026-07-29');
    });

    it('getDaysInMonth returns correct number of days for leap and non-leap years', () => {
      expect(getDaysInMonth(2026, 0)).toBe(31); // Jan 2026
      expect(getDaysInMonth(2026, 1)).toBe(28); // Feb 2026
      expect(getDaysInMonth(2024, 1)).toBe(29); // Feb 2024 (leap year)
      expect(getDaysInMonth(2026, 3)).toBe(30); // Apr 2026
    });

    it('getFirstDayOfMonth returns day index of 1st day of month', () => {
      const firstDay = getFirstDayOfMonth(2026, 6); // July 2026 starts on Wednesday (3)
      expect(firstDay).toBeGreaterThanOrEqual(0);
      expect(firstDay).toBeLessThanOrEqual(6);
    });

    it('getNotesForDate filters active notes matching target date and excludes deleted notes', () => {
      const targetTs = new Date(2026, 6, 29, 10, 0, 0).getTime();
      const otherTs = new Date(2026, 6, 28, 10, 0, 0).getTime();

      const notes: Note[] = [
        {
          id: '1', title: 'Target Note', content: '', folder: '', tags: [], isEncrypted: false,
          createdAt: targetTs, updatedAt: targetTs, isFavorite: false
        },
        {
          id: '2', title: 'Other Date Note', content: '', folder: '', tags: [], isEncrypted: false,
          createdAt: otherTs, updatedAt: otherTs, isFavorite: false
        },
        {
          id: '3', title: 'Deleted Target Note', content: '', folder: '', tags: [], isEncrypted: false,
          createdAt: targetTs, updatedAt: targetTs, isFavorite: false, isDeleted: true
        }
      ];

      const res = getNotesForDate(notes, '2026-07-29');
      expect(res.map(n => n.id)).toEqual(['1']);
    });

    it('getWeekDaysForDate returns 7 consecutive days starting from Sunday', () => {
      const date = new Date(2026, 6, 29); // Wednesday
      const week = getWeekDaysForDate(date);
      expect(week.length).toBe(7);
      expect(week[0].dayName).toBe('Sun');
      expect(week[3].dayName).toBe('Wed');
      expect(week[3].dateStr).toBe('2026-07-29');
      expect(week[6].dayName).toBe('Sat');
    });

    it('navigateCalendarDate navigates month, week, and day forward and backward', () => {
      const base = new Date(2026, 6, 15);

      const nextMonth = navigateCalendarDate(base, 'month', 1);
      expect(nextMonth.getMonth()).toBe(7);

      const prevWeek = navigateCalendarDate(base, 'week', -1);
      expect(prevWeek.getDate()).toBe(8);

      const nextDay = navigateCalendarDate(base, 'day', 1);
      expect(nextDay.getDate()).toBe(16);
    });
  });
});
