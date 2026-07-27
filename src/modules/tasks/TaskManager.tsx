import React, { useState } from 'react';
import { 
  CheckSquare, 
  Calendar, 
  AlertCircle, 
  Clock, 
  Star, 
  Tag as TagIcon, 
  Plus, 
  TrendingUp, 
  CheckCircle2, 
  Flame, 
  ChevronRight, 
  Folder
} from 'lucide-react';
import { TaskItem, Note } from '../../types';

interface TaskManagerProps {
  notes: Note[];
  onUpdateNote: (updatedNote: Note) => void;
  lang: string;
}

export const TaskManager: React.FC<TaskManagerProps> = ({ notes, onUpdateNote, lang }) => {
  const [filterMode, setFilterMode] = useState<string>('all');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'P1' | 'P2' | 'P3' | 'P4'>('P2');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskProject, setNewTaskProject] = useState('');

  // Extract all tasks across all notes + standalone tasks
  const allTasks: TaskItem[] = notes.flatMap(n => n.tasks || []);

  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date();
  tomorrow.setDate(new Date().getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  // Statistics & Streak calculation
  const completedCount = allTasks.filter(t => t.completed).length;
  const totalCount = allTasks.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const overdueCount = allTasks.filter(t => !t.completed && t.dueDate && t.dueDate < todayStr).length;
  const streakDays = Math.min(completedCount, 14); // Interactive streak counter

  // Filter Tasks
  const filteredTasks = allTasks.filter(task => {
    if (filterMode === 'today') return task.dueDate === todayStr;
    if (filterMode === 'tomorrow') return task.dueDate === tomorrowStr;
    if (filterMode === 'overdue') return !task.completed && task.dueDate && task.dueDate < todayStr;
    if (filterMode === 'completed') return task.completed;
    if (filterMode === 'high') return task.priority === 'P1';
    return true;
  });

  const handleToggleTask = (taskId: string) => {
    // Find note containing this task and update
    notes.forEach(note => {
      if (note.tasks && note.tasks.some(t => t.id === taskId)) {
        const updatedTasks = note.tasks.map(t => 
          t.id === taskId 
            ? { ...t, completed: !t.completed, completedAt: !t.completed ? Date.now() : undefined } 
            : t
        );
        onUpdateNote({ ...note, tasks: updatedTasks });
      }
    });
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;

    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      completed: false,
      dueDate: newTaskDueDate || todayStr,
      priority: newTaskPriority,
      project: newTaskProject || 'General',
      createdAt: Date.now()
    };

    // Attach to first note or active note
    if (notes.length > 0) {
      const firstNote = notes[0];
      const updatedTasks = [...(firstNote.tasks || []), newTask];
      onUpdateNote({ ...firstNote, tasks: updatedTasks });
    }

    setNewTaskTitle('');
    setNewTaskDueDate('');
  };

  return (
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      {/* Header Stats & Productivity Streak Bar */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckSquare size={22} color="var(--accent-hover)" />
            Task Manager & Productivity Hub
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Track deadlines, projects, priorities, and daily streaks</p>
        </div>

        {/* Productivity Widgets */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--bg-tertiary)', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Flame size={22} color="#f0883e" />
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Streak</span>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#f0883e' }}>{streakDays} Days 🔥</div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-tertiary)', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp size={22} color="var(--success)" />
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Completion</span>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--success)' }}>{completionRate}% ({completedCount}/{totalCount})</div>
            </div>
          </div>

          {overdueCount > 0 && (
            <div style={{ background: 'rgba(248, 81, 73, 0.15)', padding: '10px 16px', borderRadius: '8px', border: '1px solid rgba(248,81,73,0.3)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={22} color="var(--danger)" />
              <div>
                <span style={{ fontSize: '11px', color: 'var(--danger)', textTransform: 'uppercase' }}>Overdue</span>
                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--danger)' }}>{overdueCount} Tasks</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Task List & Sidebar Filters */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Filters Sidebar */}
        <div style={{ width: '220px', background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)', padding: '16px 12px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Task Views</div>
          
          <button className={`btn ${filterMode === 'all' ? 'btn-primary' : ''}`} style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '4px' }} onClick={() => setFilterMode('all')}>
            <CheckSquare size={15} /> All Tasks ({allTasks.length})
          </button>
          <button className={`btn ${filterMode === 'today' ? 'btn-primary' : ''}`} style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '4px' }} onClick={() => setFilterMode('today')}>
            <Calendar size={15} color="#388bfd" /> Today
          </button>
          <button className={`btn ${filterMode === 'tomorrow' ? 'btn-primary' : ''}`} style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '4px' }} onClick={() => setFilterMode('tomorrow')}>
            <Clock size={15} color="#a371f7" /> Tomorrow
          </button>
          <button className={`btn ${filterMode === 'overdue' ? 'btn-primary' : ''}`} style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '4px' }} onClick={() => setFilterMode('overdue')}>
            <AlertCircle size={15} color="var(--danger)" /> Overdue ({overdueCount})
          </button>
          <button className={`btn ${filterMode === 'high' ? 'btn-primary' : ''}`} style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '4px' }} onClick={() => setFilterMode('high')}>
            <Star size={15} color="#e3b341" /> High Priority (P1)
          </button>
          <button className={`btn ${filterMode === 'completed' ? 'btn-primary' : ''}`} style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => setFilterMode('completed')}>
            <CheckCircle2 size={15} color="var(--success)" /> Completed ({completedCount})
          </button>
        </div>

        {/* Task Content Column */}
        <div style={{ flex: 1, padding: '24px 36px', overflowY: 'auto' }}>
          {/* Quick Task Creation Input Bar */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <input
              type="text"
              className="input"
              placeholder="Add a new task... Press Enter to create"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              style={{ flex: 2 }}
            />
            <input
              type="date"
              className="input"
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
              style={{ width: '140px' }}
            />
            <select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value as any)}
              className="input"
              style={{ width: '100px' }}
            >
              <option value="P1">🔴 P1 High</option>
              <option value="P2">🟠 P2 Med</option>
              <option value="P3">🔵 P3 Low</option>
            </select>
            <button className="btn btn-primary" onClick={handleAddTask}>
              <Plus size={16} /> Add Task
            </button>
          </div>

          {/* Render Task Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <CheckSquare size={36} style={{ opacity: 0.3, marginBottom: '8px' }} />
                <p>No tasks found in this view.</p>
              </div>
            ) : (
              filteredTasks.map(task => (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    opacity: task.completed ? 0.6 : 1
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleTask(task.id)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                    />
                    <span style={{ fontSize: '14px', textDecoration: task.completed ? 'line-through' : 'none', color: 'var(--text-primary)' }}>
                      {task.title}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                    {task.priority === 'P1' && <span className="tag-badge" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>P1 High</span>}
                    {task.dueDate && <span style={{ color: task.dueDate < todayStr && !task.completed ? 'var(--danger)' : 'var(--text-muted)' }}><Calendar size={13} /> {task.dueDate}</span>}
                    {task.project && <span className="tag-badge"><Folder size={11} /> {task.project}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
