import React, { useState, useEffect } from 'react';
import { Search, FileText, Calendar, CheckSquare, LayoutGrid, Share2, Plus, Moon, Sun, X, Lock } from 'lucide-react';
import { Note, ViewMode } from '../../types';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  onSelectNote: (id: string) => void;
  onNewNote: () => void;
  onSetViewMode: (mode: ViewMode) => void;
  onToggleTheme: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  notes,
  onSelectNote,
  onNewNote,
  onSetViewMode,
  onToggleTheme
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(query.toLowerCase()) || 
    n.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
  ).slice(0, 5);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ width: '600px', padding: '16px', background: 'var(--bg-secondary)', top: '15vh', position: 'absolute' }}
      >
        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input"
            placeholder="Type a command or note title... (Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: '38px', fontSize: '15px' }}
            autoFocus
          />
        </div>

        {/* Quick Commands */}
        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Commands</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
          <div className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => { onNewNote(); onClose(); }}>
            <Plus size={15} color="var(--accent-hover)" /> <span>Create New Note</span>
          </div>
          <div className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => { onSetViewMode('dashboard'); onClose(); }}>
            <LayoutGrid size={15} color="#a371f7" /> <span>Open Executive Dashboard</span>
          </div>
          <div className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => { onSetViewMode('calendar'); onClose(); }}>
            <Calendar size={15} color="#388bfd" /> <span>Open Full Calendar</span>
          </div>
          <div className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => { onSetViewMode('tasks'); onClose(); }}>
            <CheckSquare size={15} color="var(--success)" /> <span>Open Task Manager</span>
          </div>
          <div className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => { onToggleTheme(); onClose(); }}>
            <Sun size={15} color="#e3b341" /> <span>Toggle Dark / Light Theme</span>
          </div>
        </div>

        {/* Notes Search Results */}
        {filteredNotes.length > 0 && (
          <>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Notes</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {filteredNotes.map(n => (
                <div
                  key={n.id}
                  onClick={() => { onSelectNote(n.id); onSetViewMode('notes'); onClose(); }}
                  style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}
                >
                  <span style={{ fontWeight: '500' }}>{n.title || 'Untitled'}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{n.folder || 'Unfiled'}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
