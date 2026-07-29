import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  CheckSquare, 
  FileText, 
  TrendingUp, 
  Flame, 
  Plus, 
  Folder, 
  Clock, 
  Sliders,
  Move
} from 'lucide-react';
import { Note, TaskItem, DashboardWidget } from '../../types';

interface DashboardViewProps {
  notes: Note[];
  onSelectNote: (id: string) => void;
  onNewNote: () => void;
  onNewCanvas: () => void;
}

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'w-progress', type: 'daily_progress', title: 'Прогресс целей', visible: true, order: 1 },
  { id: 'w-tasks', type: 'tasks_today', title: 'Активные задачи', visible: true, order: 2 },
  { id: 'w-deadlines', type: 'deadlines', title: 'Срочные дедлайны', visible: true, order: 3 },
  { id: 'w-notes', type: 'recent_notes', title: 'Недавние заметки', visible: true, order: 4 },
  { id: 'w-stats', type: 'weekly_stats', title: 'Продуктивность недели', visible: true, order: 5 },
  { id: 'w-actions', type: 'quick_actions', title: 'Быстрые действия', visible: true, order: 6 }
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  notes,
  onSelectNote,
  onNewNote,
  onNewCanvas
}) => {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(DEFAULT_WIDGETS);
  const [showConfig, setShowConfig] = useState(false);

  const allTasks: TaskItem[] = notes.flatMap(n => n.tasks || []);
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayTasks = allTasks.filter(t => t.dueDate === todayStr || !t.completed);
  const recentNotes = [...notes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);

  const completedToday = allTasks.filter(t => t.completed).length;
  const progressRate = allTasks.length > 0 ? Math.round((completedToday / allTasks.length) * 100) : 0;

  return (
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LayoutDashboard size={22} color="var(--accent-hover)" />
            Персональная панель управления
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Обзор задач, сроков, недавних заметок и продуктивности</p>
        </div>

        <button className="btn" onClick={() => setShowConfig(!showConfig)}>
          <Sliders size={14} />
          <span>Настроить виджеты</span>
        </button>
      </div>

      {/* Widget Customizer Dropdown */}
      {showConfig && (
        <div style={{ padding: '16px 28px', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {widgets.map(w => (
            <label key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={w.visible} 
                onChange={() => setWidgets(widgets.map(item => item.id === w.id ? { ...item, visible: !item.visible } : item))} 
              />
              <span>{w.title}</span>
            </label>
          ))}
        </div>
      )}

      {/* Main Dashboard Widget Grid */}
      <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Widget 1: Daily Progress */}
        {widgets.find(w => w.type === 'daily_progress')?.visible && (
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={18} color="var(--success)" /> Daily Goal Progress
              </h3>
              <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--success)' }}>{progressRate}%</span>
            </div>

            {/* Progress Bar */}
            <div style={{ width: '100%', height: '10px', background: 'var(--bg-tertiary)', borderRadius: '5px', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ width: `${progressRate}%`, height: '100%', background: 'linear-gradient(90deg, #1f6feb, #2ea043)', transition: 'width 0.3s ease' }} />
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{completedToday} of {allTasks.length} total tasks completed</p>
          </div>
        )}

        {/* Widget 2: Today Tasks */}
        {widgets.find(w => w.type === 'tasks_today')?.visible && (
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckSquare size={18} color="#388bfd" /> Active Tasks
              </h3>
              <span className="tag-badge">{todayTasks.length} pending</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {todayTasks.slice(0, 4).map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <input type="checkbox" checked={t.completed} readOnly style={{ accentColor: 'var(--accent-primary)' }} />
                  <span style={{ color: 'var(--text-primary)' }}>{t.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Widget 3: Recent Notes */}
        {widgets.find(w => w.type === 'recent_notes')?.visible && (
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={18} color="#a371f7" /> Recent Notes
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {recentNotes.map(n => (
                <div 
                  key={n.id} 
                  onClick={() => onSelectNote(n.id)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-tertiary)', cursor: 'pointer', fontSize: '13px' }}
                >
                  <span style={{ fontWeight: '500' }}>{n.title || 'Untitled'}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(n.updatedAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Widget 4: Quick Actions */}
        {widgets.find(w => w.type === 'quick_actions')?.visible && (
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '14px' }}>Quick Actions</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={onNewNote}>
                <Plus size={15} /> New Note
              </button>
              <button className="btn" onClick={onNewCanvas}>
                <LayoutDashboard size={15} /> New Canvas
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
