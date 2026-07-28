import React, { useState } from 'react';
import { Note, TaskItem } from '../../types';
import { Plus, CheckCircle, Clock, Circle, ArrowRight, Tag, FileText } from 'lucide-react';

interface KanbanViewProps {
  notes: Note[];
  onSelectNote: (id: string) => void;
  onUpdateNote: (note: Note) => void;
  onNewNote?: () => void;
  lang?: string;
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  notes,
  onSelectNote,
  onUpdateNote,
  lang = 'ru'
}) => {
  const [filterTag, setFilterTag] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  // Gather all tasks across all notes
  const activeNotes = notes.filter(n => !n.isDeleted);
  const allTags = Array.from(new Set(activeNotes.flatMap(n => n.tags)));

  // Categorize notes into Kanban columns based on tags or task statuses
  const backlogNotes = activeNotes.filter(n => {
    const isCompleted = n.tasks && n.tasks.length > 0 && n.tasks.every(t => t.completed);
    const inProgress = n.tasks && n.tasks.some(t => t.completed) && !isCompleted;
    return !n.isFavorite && !inProgress && !isCompleted;
  });

  const todoNotes = activeNotes.filter(n => n.isFavorite && (!n.tasks || !n.tasks.some(t => t.completed)));
  
  const inProgressNotes = activeNotes.filter(n => {
    return n.tasks && n.tasks.some(t => t.completed) && !n.tasks.every(t => t.completed);
  });

  const doneNotes = activeNotes.filter(n => {
    return n.tasks && n.tasks.length > 0 && n.tasks.every(t => t.completed);
  });

  const columns = [
    { id: 'backlog', title: lang === 'ru' ? '📥 Бэклог' : '📥 Backlog', notes: backlogNotes, color: '#8b949e' },
    { id: 'todo', title: lang === 'ru' ? '🎯 В планах' : '🎯 To Do', notes: todoNotes, color: '#388bfd' },
    { id: 'in_progress', title: lang === 'ru' ? '⚡ В процессе' : '⚡ In Progress', notes: inProgressNotes, color: '#d29922' },
    { id: 'done', title: lang === 'ru' ? '✅ Готово' : '✅ Completed', notes: doneNotes, color: '#2ea043' }
  ];

  const handleToggleFavorite = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateNote({
      ...note,
      isFavorite: !note.isFavorite,
      updatedAt: Date.now()
    });
  };

  return (
    <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>📋</span>
            <span>{lang === 'ru' ? 'Канбан Доска Задач и Проектов' : 'Kanban Board'}</span>
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {lang === 'ru' ? 'Наглядное управление задачами и заметками в стиле Agile' : 'Agile visual task and note status management'}
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="text"
            placeholder={lang === 'ru' ? 'Фильтр по названию...' : 'Filter cards...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              borderRadius: '8px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              outline: 'none',
              width: '200px'
            }}
          />

          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              borderRadius: '8px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer'
            }}
          >
            <option value="all">{lang === 'ru' ? 'Все теги' : 'All Tags'}</option>
            {allTags.map(t => (
              <option key={t} value={t}>#{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Board Columns Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', alignItems: 'start' }}>
        {columns.map(col => {
          const filteredColNotes = col.notes.filter(n => {
            const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase());
            const matchesTag = filterTag === 'all' || n.tags.includes(filterTag);
            return matchesSearch && matchesTag;
          });

          return (
            <div
              key={col.id}
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid var(--border-color)',
                minHeight: '500px',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Column Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '10px', borderBottom: `2px solid ${col.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{col.title}</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, background: 'var(--bg-tertiary)', color: col.color, padding: '2px 8px', borderRadius: '12px' }}>
                    {filteredColNotes.length}
                  </span>
                </div>
              </div>

              {/* Cards Container */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
                {filteredColNotes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: '12px', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                    {lang === 'ru' ? 'Нет карточек' : 'No items'}
                  </div>
                ) : (
                  filteredColNotes.map(n => {
                    const completedTasks = n.tasks?.filter(t => t.completed).length || 0;
                    const totalTasks = n.tasks?.length || 0;

                    return (
                      <div
                        key={n.id}
                        onClick={() => onSelectNote(n.id)}
                        style={{
                          background: 'var(--bg-tertiary)',
                          borderRadius: '8px',
                          padding: '12px',
                          border: '1px solid var(--border-color)',
                          cursor: 'pointer',
                          transition: 'transform 0.15s ease, border-color 0.15s ease',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.borderColor = col.color;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                          <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {n.title || (lang === 'ru' ? 'Без названия' : 'Untitled Note')}
                          </h4>
                          <button
                            onClick={(e) => handleToggleFavorite(n, e)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: n.isFavorite ? '#ffb703' : 'var(--text-muted)', fontSize: '14px' }}
                            title="Toggle favorite"
                          >
                            ★
                          </button>
                        </div>

                        {/* Note Snippet */}
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '10px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: '1.4' }}>
                          {n.content.replace(/[#*`_~]/g, '').slice(0, 100)}
                        </p>

                        {/* Progress bar if tasks exist */}
                        {totalTasks > 0 && (
                          <div style={{ marginBottom: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                              <span>{lang === 'ru' ? 'Прогресс' : 'Progress'}</span>
                              <span>{completedTasks}/{totalTasks}</span>
                            </div>
                            <div style={{ height: '4px', background: 'var(--bg-primary)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${(completedTasks / totalTasks) * 100}%`, background: col.color, transition: 'width 0.3s ease' }} />
                            </div>
                          </div>
                        )}

                        {/* Card Tags & Footer */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {n.tags.slice(0, 2).map(tag => (
                              <span key={tag} style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '4px', background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
                                #{tag}
                              </span>
                            ))}
                          </div>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {new Date(n.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
