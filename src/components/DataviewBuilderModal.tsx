import React, { useState } from 'react';
import { Database, Plus, X, Sparkles } from 'lucide-react';

interface DataviewBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertQuery: (queryCode: string) => void;
  availableTags: string[];
}

export const DataviewBuilderModal: React.FC<DataviewBuilderModalProps> = ({
  isOpen,
  onClose,
  onInsertQuery,
  availableTags
}) => {
  const [queryType, setQueryType] = useState<'TABLE' | 'LIST' | 'TASK'>('TABLE');
  const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [fields, setFields] = useState<string>('file.name, file.mtime, tags');
  const [sortField, setSortField] = useState<string>('file.mtime');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [limit, setLimit] = useState<number>(10);

  if (!isOpen) return null;

  const handleGenerate = () => {
    let query = `\`\`\`dataview\n`;
    if (queryType === 'TABLE') {
      query += `TABLE ${fields}\n`;
    } else if (queryType === 'LIST') {
      query += `LIST\n`;
    } else if (queryType === 'TASK') {
      query += `TASK\n`;
    }

    if (selectedTag) {
      query += `FROM #${selectedTag}\n`;
    }

    if (queryType === 'TASK' && taskStatusFilter !== 'all') {
      query += `WHERE ${taskStatusFilter}\n`;
    }

    if (sortField) {
      query += `SORT ${sortField} ${sortOrder}\n`;
    }
    if (limit > 0) {
      query += `LIMIT ${limit}\n`;
    }
    query += `\`\`\`\n`;

    onInsertQuery(query);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '460px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', boxShadow: '0 16px 40px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={20} color="var(--accent-primary)" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Dataview Query Builder</h3>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Query Type</label>
            <select
              value={queryType}
              onChange={(e) => setQueryType(e.target.value as 'TABLE' | 'LIST' | 'TASK')}
              style={{ width: '100%', padding: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none' }}
            >
              <option value="TABLE">TABLE (Structured Grid)</option>
              <option value="LIST">LIST (Bullet List of Notes)</option>
              <option value="TASK">TASK (Task List / Action Items)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Filter Tag (FROM)</label>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              style={{ width: '100%', padding: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none' }}
            >
              <option value="">All Notes / Tasks (No Tag Filter)</option>
              {availableTags.map(tag => (
                <option key={tag} value={tag}>#{tag}</option>
              ))}
            </select>
          </div>

          {queryType === 'TABLE' && (
            <div>
              <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Fields (TABLE)</label>
              <input
                type="text"
                value={fields}
                onChange={(e) => setFields(e.target.value)}
                placeholder="file.name, file.mtime, tags, status, priority"
                style={{ width: '100%', padding: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
          )}

          {queryType === 'TASK' && (
            <div>
              <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Task Status Filter</label>
              <select
                value={taskStatusFilter}
                onChange={(e) => setTaskStatusFilter(e.target.value as any)}
                style={{ width: '100%', padding: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none' }}
              >
                <option value="all">All Tasks</option>
                <option value="pending">Pending (Incomplete)</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Sort By</label>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                style={{ width: '100%', padding: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none' }}
              >
                {queryType === 'TASK' ? (
                  <>
                    <option value="priority">Priority</option>
                    <option value="dueDate">Due Date</option>
                    <option value="title">Task Title</option>
                  </>
                ) : (
                  <>
                    <option value="file.mtime">Last Modified (mtime)</option>
                    <option value="file.name">Note Title (name)</option>
                    <option value="file.ctime">Created Date (ctime)</option>
                  </>
                )}
              </select>
            </div>
            <div style={{ width: '100px' }}>
              <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'ASC' | 'DESC')}
                style={{ width: '100%', padding: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none' }}
              >
                <option value="DESC">DESC</option>
                <option value="ASC">ASC</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Max Results (LIMIT)</label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              min={1}
              max={100}
              style={{ width: '100%', padding: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleGenerate} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} />
            <span>Insert Query</span>
          </button>
        </div>
      </div>
    </div>
  );
};
