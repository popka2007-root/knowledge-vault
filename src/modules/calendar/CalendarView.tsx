import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, FileText, CheckSquare, Clock } from 'lucide-react';
import { Note } from '../../types';

export interface CalendarViewProps {
  notes: Note[];
  onSelectNote: (id: string) => void;
  onNewNoteForDate: (dateStr: string) => void;
}

export function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dNum = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dNum}`;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function getNotesForDate(notes: Note[], dateStr: string): Note[] {
  return notes.filter(n => {
    if (n.isDeleted) return false;
    return formatLocalDate(new Date(n.createdAt)) === dateStr;
  });
}

export function getWeekDaysForDate(currentDate: Date): { date: Date; dateStr: string; dayName: string }[] {
  const dayOfWeek = currentDate.getDay();
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - dayOfWeek);

  const days: { date: Date; dateStr: string; dayName: string }[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    days.push({
      date: d,
      dateStr: formatLocalDate(d),
      dayName: dayNames[i]
    });
  }
  return days;
}

export function navigateCalendarDate(
  currentDate: Date,
  viewType: 'month' | 'week' | 'day',
  delta: number
): Date {
  const next = new Date(currentDate);
  if (viewType === 'month') {
    next.setMonth(next.getMonth() + delta);
  } else if (viewType === 'week') {
    next.setDate(next.getDate() + delta * 7);
  } else if (viewType === 'day') {
    next.setDate(next.getDate() + delta);
  }
  return next;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ notes, onSelectNote, onNewNoteForDate }) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewType, setViewType] = useState<'month' | 'week' | 'day'>('month');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrev = () => {
    setCurrentDate(prev => navigateCalendarDate(prev, viewType, -1));
  };

  const handleNext = () => {
    setCurrentDate(prev => navigateCalendarDate(prev, viewType, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Month grid cells
  const monthGridCells: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    monthGridCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    monthGridCells.push(day);
  }

  const todayStr = formatLocalDate(new Date());
  const weekDays = getWeekDaysForDate(currentDate);
  const selectedDayStr = formatLocalDate(currentDate);
  const selectedDayNotes = getNotesForDate(notes, selectedDayStr);

  return (
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      {/* Top Calendar Toolbar */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarIcon size={20} color="var(--accent-hover)" />
            {monthNames[month]} {year}
            {viewType === 'day' && <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>— Day {currentDate.getDate()}</span>}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button className="btn-icon" onClick={handlePrev} title="Previous">
              <ChevronLeft size={18} />
            </button>
            <button className="btn" onClick={handleToday} style={{ padding: '4px 10px', fontSize: '12px' }}>
              Today
            </button>
            <button className="btn-icon" onClick={handleNext} title="Next">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* View Type Switcher */}
        <div style={{ display: 'flex', background: 'var(--bg-tertiary)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <button className={`btn ${viewType === 'month' ? 'btn-primary' : ''}`} style={{ padding: '4px 12px', fontSize: '12px' }} onClick={() => setViewType('month')}>
            Month
          </button>
          <button className={`btn ${viewType === 'week' ? 'btn-primary' : ''}`} style={{ padding: '4px 12px', fontSize: '12px' }} onClick={() => setViewType('week')}>
            Week
          </button>
          <button className={`btn ${viewType === 'day' ? 'btn-primary' : ''}`} style={{ padding: '4px 12px', fontSize: '12px' }} onClick={() => setViewType('day')}>
            Day
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div style={{ flex: 1, padding: '16px 24px', overflowY: 'auto' }}>
        {viewType === 'month' && (
          <>
            {/* Days of Week Header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
              <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>

            {/* Month Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', minHeight: '520px' }}>
              {monthGridCells.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} style={{ background: 'transparent' }} />;

                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isToday = todayStr === dateStr;
                const dayNotes = getNotesForDate(notes, dateStr);

                return (
                  <div
                    key={dateStr}
                    onClick={() => onNewNoteForDate(dateStr)}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: isToday ? '2px solid var(--accent-hover)' : '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease',
                      minHeight: '90px'
                    }}
                    className="calendar-day-cell"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', fontWeight: isToday ? '700' : '500', color: isToday ? 'var(--accent-hover)' : 'var(--text-primary)' }}>
                        {day}
                      </span>
                      {dayNotes.length > 0 && (
                        <span className="tag-badge" style={{ fontSize: '10px', padding: '1px 5px' }}>
                          {dayNotes.length} notes
                        </span>
                      )}
                    </div>

                    <div style={{ marginTop: '6px' }}>
                      {dayNotes.slice(0, 3).map(n => (
                        <div
                          key={n.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectNote(n.id);
                          }}
                          style={{
                            fontSize: '10.5px',
                            background: 'var(--bg-tertiary)',
                            padding: '3px 6px',
                            borderRadius: '4px',
                            marginBottom: '3px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: 'var(--text-primary)',
                            borderLeft: '2px solid var(--accent-hover)'
                          }}
                        >
                          {n.title || 'Untitled'}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {viewType === 'week' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px', minHeight: '520px' }}>
            {weekDays.map(w => {
              const isToday = w.dateStr === todayStr;
              const dayNotes = getNotesForDate(notes, w.dateStr);

              return (
                <div
                  key={w.dateStr}
                  onClick={() => onNewNoteForDate(w.dateStr)}
                  style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: '10px',
                    padding: '12px',
                    border: isToday ? '2px solid var(--accent-hover)' : '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{w.dayName}</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: isToday ? 'var(--accent-hover)' : 'var(--text-primary)' }}>
                      {w.date.getDate()}
                    </div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {dayNotes.length === 0 ? (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '20px' }}>
                        Click to add note
                      </div>
                    ) : (
                      dayNotes.map(n => (
                        <div
                          key={n.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectNote(n.id);
                          }}
                          style={{
                            fontSize: '11px',
                            background: 'var(--bg-tertiary)',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            color: 'var(--text-primary)',
                            borderLeft: '3px solid var(--accent-hover)'
                          }}
                        >
                          <div style={{ fontWeight: 600, marginBottom: '2px' }}>{n.title || 'Untitled'}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {n.content.slice(0, 40)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewType === 'day' && (
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border-color)', minHeight: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Notes for {currentDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selectedDayNotes.length} notes recorded</span>
              </div>
              <button className="btn btn-primary" onClick={() => onNewNoteForDate(selectedDayStr)} style={{ padding: '6px 12px', fontSize: '12px' }}>
                <Plus size={14} />
                <span>Add Note for this Date</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {selectedDayNotes.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', gridColumn: '1 / -1', textAlign: 'center', padding: '48px 0' }}>
                  No notes created on this date. Click above to create one!
                </div>
              ) : (
                selectedDayNotes.map(n => (
                  <div
                    key={n.id}
                    onClick={() => onSelectNote(n.id)}
                    style={{
                      background: 'var(--bg-tertiary)',
                      borderRadius: '8px',
                      padding: '16px',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer'
                    }}
                  >
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                      {n.title || 'Untitled'}
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {n.content.slice(0, 120)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
