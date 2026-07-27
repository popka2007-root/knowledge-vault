import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, FileText, CheckSquare, Clock } from 'lucide-react';
import { Note, TaskItem } from '../../types';

interface CalendarViewProps {
  notes: Note[];
  onSelectNote: (id: string) => void;
  onNewNoteForDate: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ notes, onSelectNote, onNewNoteForDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'month' | 'week' | 'day'>('month');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Build grid days
  const gridCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    gridCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    gridCells.push(day);
  }

  return (
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      {/* Top Calendar Toolbar */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarIcon size={20} color="var(--accent-hover)" />
            {monthNames[month]} {year}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button className="btn-icon" onClick={handlePrevMonth} title="Previous Month">
              <ChevronLeft size={18} />
            </button>
            <button className="btn" onClick={handleToday} style={{ padding: '4px 10px', fontSize: '12px' }}>
              Today
            </button>
            <button className="btn-icon" onClick={handleNextMonth} title="Next Month">
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

      {/* Month Calendar Grid */}
      <div style={{ flex: 1, padding: '16px 24px', overflowY: 'auto' }}>
        {/* Days of Week Header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>

        {/* Month Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', height: 'calc(100% - 30px)' }}>
          {gridCells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} style={{ background: 'transparent' }} />;

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const getLocalDateString = (d: Date) => {
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, '0');
              const dNum = String(d.getDate()).padStart(2, '0');
              return `${y}-${m}-${dNum}`;
            };
            const isToday = getLocalDateString(new Date()) === dateStr;

            // Notes on this date
            const dayNotes = notes.filter(n => getLocalDateString(new Date(n.createdAt)) === dateStr);

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
                  {dayNotes.slice(0, 2).map(n => (
                    <div
                      key={n.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectNote(n.id);
                      }}
                      style={{
                        fontSize: '10.5px',
                        background: 'var(--bg-tertiary)',
                        padding: '2px 4px',
                        borderRadius: '3px',
                        marginBottom: '3px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'var(--text-secondary)'
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
      </div>
    </div>
  );
};
