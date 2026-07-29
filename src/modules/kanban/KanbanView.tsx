import React, { useState } from 'react';
import { Note } from '../../types';
import { Plus, CheckCircle2, Clock, ListTodo, CheckSquare, Search, Tag, Filter, Award } from 'lucide-react';

export type KanbanColumnId = 'backlog' | 'todo' | 'in_progress' | 'done';

export interface KanbanViewProps {
  notes: Note[];
  onSelectNote: (id: string) => void;
  onUpdateNote: (note: Note) => void;
  onNewNote?: () => void;
  lang?: string;
}

export function getNoteStatus(note: Note): KanbanColumnId {
  const statusStr = note.status || (note as any).kanbanStatus;
  if (statusStr && ['backlog', 'todo', 'in_progress', 'done'].includes(statusStr)) {
    return statusStr as KanbanColumnId;
  }
  // Fallback state inference based on tasks & favorites
  if (note.tasks && note.tasks.length > 0 && note.tasks.every(t => t.completed)) {
    return 'done';
  }
  if (note.tasks && note.tasks.some(t => t.completed)) {
    return 'in_progress';
  }
  if (note.isFavorite) {
    return 'todo';
  }
  return 'backlog';
}

export function moveNoteToColumn(note: Note, columnId: KanbanColumnId): Note {
  let updatedTasks = note.tasks;
  
  if (columnId === 'done' && note.tasks && note.tasks.length > 0) {
    updatedTasks = note.tasks.map(t => ({ ...t, completed: true }));
  } else if (columnId === 'backlog' && note.tasks && note.tasks.length > 0) {
    updatedTasks = note.tasks.map(t => ({ ...t, completed: false }));
  }

  return {
    ...note,
    status: columnId,
    kanbanStatus: columnId,
    tasks: updatedTasks,
    isFavorite: columnId === 'todo' ? true : note.isFavorite,
    updatedAt: Date.now()
  };
}

export function filterKanbanNotes(
  notes: Note[],
  columnId: KanbanColumnId,
  search: string,
  tag: string
): Note[] {
  return notes.filter(n => {
    if (n.isDeleted) return false;
    const statusMatches = getNoteStatus(n) === columnId;
    const searchMatches =
      !search ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase());
    const tagMatches = tag === 'all' || (n.tags && n.tags.includes(tag));
    return statusMatches && searchMatches && tagMatches;
  });
}

export function calculateKanbanMetrics(notes: Note[]) {
  const activeNotes = notes.filter(n => !n.isDeleted);
  const totalNotes = activeNotes.length;

  let backlogCount = 0;
  let todoCount = 0;
  let inProgressCount = 0;
  let doneCount = 0;
  let totalTasks = 0;
  let completedTasks = 0;

  activeNotes.forEach(n => {
    const status = getNoteStatus(n);
    if (status === 'backlog') backlogCount++;
    else if (status === 'todo') todoCount++;
    else if (status === 'in_progress') inProgressCount++;
    else if (status === 'done') doneCount++;

    if (n.tasks && n.tasks.length > 0) {
      totalTasks += n.tasks.length;
      completedTasks += n.tasks.filter(t => t.completed).length;
    }
  });

  const completionPercentage = totalNotes > 0 ? Math.round((doneCount / totalNotes) * 100) : 0;
  const taskProgressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    totalNotes,
    backlogCount,
    todoCount,
    inProgressCount,
    doneCount,
    completionPercentage,
    totalTasks,
    completedTasks,
    taskProgressPercentage
  };
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  notes,
  onSelectNote,
  onUpdateNote,
  onNewNote,
  lang = 'ru'
}) => {
  const [filterTag, setFilterTag] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  const activeNotes = notes.filter(n => !n.isDeleted);
  const allTags = Array.from(new Set(activeNotes.flatMap(n => n.tags || [])));
  const metrics = calculateKanbanMetrics(notes);

  const columns: { id: KanbanColumnId; title: string; color: string; icon: React.ReactNode }[] = [
    { id: 'backlog', title: lang === 'ru' ? '📥 Бэклог' : '📥 Backlog', color: '#8b949e', icon: <ListTodo size={16} /> },
    { id: 'todo', title: lang === 'ru' ? '🎯 В планах' : '🎯 To Do', color: '#388bfd', icon: <Clock size={16} /> },
    { id: 'in_progress', title: lang === 'ru' ? '⚡ В процессе' : '⚡ In Progress', color: '#d29922', icon: <CheckSquare size={16} /> },
    { id: 'done', title: lang === 'ru' ? '✅ Готово' : '✅ Completed', color: '#2ea043', icon: <CheckCircle2 size={16} /> }
  ];

  const handleToggleFavorite = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateNote({
      ...note,
      isFavorite: !note.isFavorite,
      updatedAt: Date.now()
    });
  };

  const handleDragStart = (e: React.DragEvent, noteId: string) => {
    e.dataTransfer.setData('text/plain', noteId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedNoteId(noteId);
  };

  const handleDragOver = (e: React.DragEvent, colId: KanbanColumnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumnId !== colId) {
      setDragOverColumnId(colId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, colId: KanbanColumnId) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverColumnId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, colId: KanbanColumnId) => {
    e.preventDefault();
    setDragOverColumnId(null);
    const noteId = e.dataTransfer.getData('text/plain') || draggedNoteId;
    if (noteId) {
      const noteToMove = notes.find(n => n.id === noteId);
      if (noteToMove) {
        const updated = moveNoteToColumn(noteToMove, colId);
        onUpdateNote(updated);
      }
    }
    setDraggedNoteId(null);
  };

  return (
    <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Metrics Dashboard */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>📋</span>
              <span>{lang === 'ru' ? 'Канбан Доска Задач и Проектов' : 'Agile Kanban Board'}</span>
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {lang === 'ru' ? 'Наглядное управление задачами и заметками в стиле Agile' : 'Agile visual task and note status management'}
            </p>
          </div>

          {/* Search & Tag Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={lang === 'ru' ? 'Фильтр по названию...' : 'Filter cards...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  padding: '6px 12px 6px 30px',
                  fontSize: '12px',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  outline: 'none',
                  width: '200px'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={14} style={{ color: 'var(--text-muted)' }} />
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

            {onNewNote && (
              <button className="btn btn-primary" onClick={onNewNote} style={{ padding: '6px 12px', fontSize: '12px' }}>
                <Plus size={14} />
                <span>{lang === 'ru' ? 'Новая карточка' : 'New Card'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Task & Board Metrics Summary Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          background: 'var(--bg-secondary)',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid var(--border-color)'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{lang === 'ru' ? 'Всего карточек' : 'Total Cards'}</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{metrics.totalNotes}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{lang === 'ru' ? 'Завершено карточек' : 'Completed Cards'}</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#2ea043' }}>
              {metrics.doneCount} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>({metrics.completionPercentage}%)</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{lang === 'ru' ? 'Прогресс подзадач' : 'Subtask Progress'}</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#388bfd' }}>
              {metrics.completedTasks}/{metrics.totalTasks} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>({metrics.taskProgressPercentage}%)</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{lang === 'ru' ? 'Общий прогресс' : 'Overall Progress'}</div>
            <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${metrics.completionPercentage}%`, background: 'var(--accent-hover)', transition: 'width 0.4s ease' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Board Columns Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', alignItems: 'start', flex: 1 }}>
        {columns.map(col => {
          const colNotes = filterKanbanNotes(notes, col.id, search, filterTag);
          const isDragOver = dragOverColumnId === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={(e) => handleDragLeave(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
              style={{
                background: isDragOver ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                borderRadius: '12px',
                padding: '16px',
                border: isDragOver ? `2px dashed ${col.color}` : '1px solid var(--border-color)',
                minHeight: '480px',
                display: 'flex',
                flexDirection: 'column',
                transition: 'background 0.2s ease, border-color 0.2s ease'
              }}
            >
              {/* Column Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '10px', borderBottom: `2px solid ${col.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{col.title}</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, background: 'var(--bg-tertiary)', color: col.color, padding: '2px 8px', borderRadius: '12px' }}>
                    {colNotes.length}
                  </span>
                </div>
              </div>

              {/* Cards Container */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
                {colNotes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: '12px', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                    {lang === 'ru' ? 'Перетащите сюда карточку' : 'Drop cards here'}
                  </div>
                ) : (
                  colNotes.map(n => {
                    const completedTasks = n.tasks?.filter(t => t.completed).length || 0;
                    const totalTasks = n.tasks?.length || 0;
                    const isBeingDragged = draggedNoteId === n.id;

                    return (
                      <div
                        key={n.id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, n.id)}
                        onClick={() => onSelectNote(n.id)}
                        style={{
                          background: 'var(--bg-tertiary)',
                          borderRadius: '8px',
                          padding: '12px',
                          border: '1px solid var(--border-color)',
                          cursor: 'grab',
                          opacity: isBeingDragged ? 0.4 : 1,
                          transition: 'transform 0.15s ease, border-color 0.15s ease, opacity 0.15s ease',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        onMouseEnter={(e) => {
                          if (!isBeingDragged) {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.borderColor = col.color;
                          }
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
                          {n.content ? n.content.replace(/[#*`_~]/g, '').slice(0, 100) : (lang === 'ru' ? 'Нет содержимого...' : 'No content...')}
                        </p>

                        {/* Progress bar if tasks exist */}
                        {totalTasks > 0 && (
                          <div style={{ marginBottom: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                              <span>{lang === 'ru' ? 'Прогресс' : 'Progress'}</span>
                              <span>{completedTasks}/{totalTasks} ({Math.round((completedTasks / totalTasks) * 100)}%)</span>
                            </div>
                            <div style={{ height: '4px', background: 'var(--bg-primary)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${(completedTasks / totalTasks) * 100}%`, background: col.color, transition: 'width 0.3s ease' }} />
                            </div>
                          </div>
                        )}

                        {/* Card Tags & Footer */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {n.tags && n.tags.slice(0, 3).map(tag => (
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
