import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { NoteList } from './components/NoteList';
import { Editor } from './components/Editor';
import { CanvasView } from './components/CanvasView';
import { GraphView } from './components/GraphView';
import { VaultModal } from './components/VaultModal';
import { DashboardView } from './modules/dashboard/DashboardView';
import { CalendarView } from './modules/calendar/CalendarView';
import { TaskManager } from './modules/tasks/TaskManager';
import { CommandPaletteModal } from './modules/workspace/CommandPaletteModal';
import { TrashBinView } from './components/TrashBinView';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { KanbanView } from './modules/kanban/KanbanView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { loadNotesFromIDB, saveNotesToIDB } from './utils/storage';
import { Note, Folder, ViewMode, Theme, SyncState, NoteSnapshot } from './types';
import { Language } from './utils/i18n';
import { ToastContainer } from './components/ToastContainer';
import { ShortcutsModal } from './components/ShortcutsModal';
import { PomodoroWidget } from './components/PomodoroWidget';
import { processTemplate, DEFAULT_TEMPLATES } from './modules/templater/templateEngine';

const INITIAL_NOTES: Note[] = [
  {
    id: 'note-emotions',
    title: 'Emotions',
    content: `# Emotions

*Perhaps it is our emotions. How **strong** they are? How <u>lively</u>, vigorous and energetic. When anger burns in our veins, thoughts are in a torrent, all thrown here and there, helpless at the mercy of a <mark style="background:rgba(56,139,253,0.4); color:#fff; padding:2px 4px; border-radius:3px;">ferocious beast</mark>. Or when love drives us mad, where are these thoughts? Why don't they turn this madness around? Why don't they argue on their behalf to the stubborn barbaric horde that destroys the order and magnificence of their peaceful, calm cities?*

## But what are emotions?

Are they from <mark style="background:rgba(163,113,247,0.4); color:#fff; padding:2px 4px; border-radius:3px;">nothingness</mark> or have they any origins? Yes. Thoughts. They cower fearfully under the mighty will of these uncouth emotions. They lock themselves in their homes, hiding from the wrath of a heathen horde prowling around. And then the barbarian chief arrives and their curiosity drives them to the windows where they look fearfully at his arrival. And then they laugh. A thought. <u>Another thought driving all these barbaric emotions.</u>

### Task Checklist
- [x] Analyze emotional responses
- [x] Implement rich text formatting
- [ ] Create LaTeX formulas
- [ ] Connect notes via [[Obsidian Architecture]]

### Dataview Dynamic Query Result
\`\`\`dataview
TASK WHERE pending
\`\`\`

### Data & Formulas
$$
E = mc^2 \quad \text{and} \quad \sum_{i=1}^n x_i = \frac{n(n+1)}{2}
$$

| Metric | Target | Status |
| --- | --- | --- |
| Formatting | 100% | Done |
| Math Support | LaTeX | Enabled |
| Tables | GFM | Supported |
`,
    folder: 'folder-general',
    tags: ['emotions', 'philosophy', 'notesnook'],
    isEncrypted: false,
    createdAt: Date.now() - 3600000 * 24,
    updatedAt: Date.now() - 3600000 * 2,
    isFavorite: true,
    banner: {
      type: 'gradient',
      color: 'linear-gradient(135deg, #1f6feb 0%, #a371f7 100%)',
      overlayOpacity: 0.2
    },
    tasks: [
      { id: 't1', title: 'Analyze emotional responses', completed: true, createdAt: Date.now() },
      { id: 't2', title: 'Implement rich text formatting', completed: true, createdAt: Date.now() },
      { id: 't3', title: 'Create LaTeX formulas', completed: false, dueDate: new Date().toISOString().slice(0, 10), priority: 'P1', createdAt: Date.now() }
    ]
  },
  {
    id: 'note-obsidian',
    title: 'Obsidian Architecture',
    content: `# Obsidian Core Engine

Notes are stored in standard Markdown (.md) format. You can reference other notes using double square brackets like [[Emotions]].

Check out the interactive **Graph View** in the sidebar to see connections between your notes!

#obsidian #markdown`,
    folder: 'folder-research',
    tags: ['obsidian', 'markdown'],
    isEncrypted: false,
    createdAt: Date.now() - 3600000 * 12,
    updatedAt: Date.now() - 3600000 * 1,
    isFavorite: false
  }
];

const INITIAL_FOLDERS: Folder[] = [
  { id: 'folder-general', name: 'General Notes', parentId: null },
  { id: 'folder-research', name: 'Research & Ideas', parentId: null },
  { id: 'folder-personal', name: 'Personal Vault', parentId: null }
];

export const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('ru');

  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem('kv_notes');
      return saved ? JSON.parse(saved) : INITIAL_NOTES;
    } catch (e) {
      return INITIAL_NOTES;
    }
  });

  const [folders, setFolders] = useState<Folder[]>(() => {
    try {
      const saved = localStorage.getItem('kv_folders');
      return saved ? JSON.parse(saved) : INITIAL_FOLDERS;
    } catch (e) {
      return INITIAL_FOLDERS;
    }
  });

  // Multi-Tab Workspace State
  const [openTabIds, setOpenTabIds] = useState<string[]>([INITIAL_NOTES[0].id]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(INITIAL_NOTES[0].id);
  
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [theme, setTheme] = useState<Theme>('dark');
  const [syncState, setSyncState] = useState<SyncState>('synced');
  
  // Split-Screen Dual View State
  const [isSplitView, setIsSplitView] = useState<boolean>(false);
  const [secondNoteId, setSecondNoteId] = useState<string | null>(null);
  const [isLoadedFromIDB, setIsLoadedFromIDB] = useState(false);
  
  // Mobile Responsiveness State
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileView, setMobileView] = useState<'sidebar' | 'notelist' | 'workspace'>('sidebar');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Modals
  const [vaultModalOpen, setVaultModalOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [targetVaultNote, setTargetVaultNote] = useState<Note | null>(null);

  // History Modal State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Load from IndexedDB on startup safely
  useEffect(() => {
    loadNotesFromIDB()
      .then(idbNotes => {
        if (idbNotes && idbNotes.length > 0) {
          setNotes(idbNotes);
        }
      })
      .catch(err => {
        console.error('Failed loading notes from IndexedDB:', err);
      })
      .finally(() => {
        setIsLoadedFromIDB(true);
      });
  }, []);

  // Sync to IndexedDB & LocalStorage safely (only after initial IDB load completes)
  useEffect(() => {
    if (!isLoadedFromIDB) return;
    
    saveNotesToIDB(notes).catch(err => console.error('Failed saving notes to IndexedDB:', err));
    try {
      localStorage.setItem('kv_notes', JSON.stringify(notes));
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded! Saved to IndexedDB.');
      }
    }
  }, [notes, isLoadedFromIDB]);

  useEffect(() => {
    try {
      localStorage.setItem('kv_folders', JSON.stringify(folders));
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded! Cannot save folders to LocalStorage.');
      }
    }
  }, [folders]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);

  // Global Keyboard Shortcuts Listener (Ctrl+P / Cmd+K / ?)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'p' || e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      } else if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setShortcutsModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const allTags = Array.from(new Set(notes.flatMap(n => n.tags || [])));

  const filteredNotes = notes.filter(note => {
    if (note.isDeleted) return false;
    if (showFavoritesOnly && !note.isFavorite) return false;
    if (selectedFolder && note.folder !== selectedFolder) return false;
    if (selectedTag && (!note.tags || !note.tags.includes(selectedTag))) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (note.title || '').toLowerCase().includes(q);
      const matchContent = (note.content || '').toLowerCase().includes(q);
      const matchTags = (note.tags || []).some(t => (t || '').toLowerCase().includes(q));
      return matchTitle || matchContent || matchTags;
    }
    return true;
  });

  const selectedNote = notes.find(n => n.id === selectedNoteId && !n.isDeleted) || (filteredNotes.length > 0 ? filteredNotes[0] : null);

  const handleOpenNoteTab = (id: string) => {
    if (!openTabIds.includes(id)) {
      setOpenTabIds([...openTabIds, id]);
    }
    setSelectedNoteId(id);
    setMobileView('workspace');
  };

  const handleCloseNoteTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = openTabIds.filter(tId => tId !== id);
    setOpenTabIds(remaining);
    if (selectedNoteId === id) {
      setSelectedNoteId(remaining.length > 0 ? remaining[remaining.length - 1] : null);
    }
  };

  const handleNewNote = () => {
    const defaultTemplate = DEFAULT_TEMPLATES[0].content;
    const processedContent = processTemplate(defaultTemplate, 'Untitled Note', notes);

    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `note-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const newNote: Note = {
      id: newId,
      title: 'Untitled Note',
      content: processedContent,
      folder: selectedFolder || '',
      tags: selectedTag ? [selectedTag] : [],
      isEncrypted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isFavorite: false
    };

    setNotes([newNote, ...notes]);
    handleOpenNoteTab(newNote.id);
    setViewMode('notes');
  };

  const handleNewNoteForDate = (dateStr: string) => {
    const journalTitle = `Daily Journal — ${dateStr}`;
    const existing = notes.find(n => n.title.toLowerCase() === journalTitle.toLowerCase() && !n.isDeleted);
    if (existing) {
      handleOpenNoteTab(existing.id);
      setViewMode('notes');
      return;
    }

    const templateText = DEFAULT_TEMPLATES[0].content;
    const processed = processTemplate(templateText, journalTitle, notes);

    const newNote: Note = {
      id: `note-journal-${Date.now()}`,
      title: journalTitle,
      content: processed,
      folder: 'folder-general',
      tags: ['journal', 'daily'],
      isEncrypted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isFavorite: false
    };

    setNotes([newNote, ...notes]);
    handleOpenNoteTab(newNote.id);
    setViewMode('notes');
  };

  const handleUpdateNote = (updated: Note) => {
    setNotes(notes.map(n => n.id === updated.id ? updated : n));
  };

  const handleSoftDeleteNote = (id: string) => {
    setNotes(notes.map(n => n.id === id ? { ...n, isDeleted: true, deletedAt: Date.now() } : n));
    const remainingTabs = openTabIds.filter(tId => tId !== id);
    setOpenTabIds(remainingTabs);
    const remainingNotes = filteredNotes.filter(n => n.id !== id);
    setSelectedNoteId(remainingNotes.length > 0 ? remainingNotes[0].id : null);
  };

  const handleRestoreNote = (id: string) => {
    setNotes(notes.map(n => n.id === id ? { ...n, isDeleted: false, deletedAt: undefined } : n));
  };

  const handlePermanentDeleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
    const remainingTabs = openTabIds.filter(tId => tId !== id);
    setOpenTabIds(remainingTabs);
    if (selectedNoteId === id) {
      setSelectedNoteId(remainingTabs.length > 0 ? remainingTabs[remainingTabs.length - 1] : null);
    }
  };

  const handleEmptyTrash = () => {
    if (window.confirm('Are you sure you want to permanently delete all items in the trash?')) {
      const deletedIds = new Set(notes.filter(n => n.isDeleted).map(n => n.id));
      setNotes(notes.filter(n => !n.isDeleted));
      const remainingTabs = openTabIds.filter(tId => !deletedIds.has(tId));
      setOpenTabIds(remainingTabs);
      if (selectedNoteId && deletedIds.has(selectedNoteId)) {
        setSelectedNoteId(remainingTabs.length > 0 ? remainingTabs[remainingTabs.length - 1] : null);
      }
    }
  };

  const handleRestoreSnapshot = (snapshot: NoteSnapshot) => {
    if (selectedNote) {
      handleUpdateNote({
        ...selectedNote,
        title: snapshot.title,
        content: snapshot.content,
        updatedAt: Date.now()
      });
      setHistoryModalOpen(false);
    }
  };

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes(notes.map(n => n.id === id ? { ...n, isFavorite: !n.isFavorite } : n));
  };

  const handleNewFolder = () => {
    const folderName = prompt('Enter folder name:');
    if (folderName) {
      const newFolder: Folder = {
        id: `folder-${Date.now()}`,
        name: folderName,
        parentId: null
      };
      setFolders([...folders, newFolder]);
    }
  };

  const handleSelectNoteByTitle = (title: string) => {
    const target = notes.find(n => (n.title || '').toLowerCase().trim() === title.toLowerCase().trim());
    if (target) {
      handleOpenNoteTab(target.id);
      setViewMode('notes');
    } else {
      const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `note-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const newNote: Note = {
        id: newId,
        title: title,
        content: `# ${title}\n\nLinked from WikiLink.`,
        folder: '',
        tags: [],
        isEncrypted: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isFavorite: false
      };
      setNotes([newNote, ...notes]);
      handleOpenNoteTab(newNote.id);
      setViewMode('notes');
    }
  };

  const handleLockVaultNote = (note: Note) => {
    setTargetVaultNote(note);
    setVaultModalOpen(true);
  };

  const handleImportObsidianNotes = (importedNotes: Note[]) => {
    setNotes([...importedNotes, ...notes]);
    if (importedNotes.length > 0) {
      handleOpenNoteTab(importedNotes[0].id);
    }
  };

  return (
    <div className="app-container">
      {/* 1st Column: Sidebar Navigation */}
      {(!isMobile || mobileView === 'sidebar') && (
      <Sidebar
        notes={notes}
        viewMode={viewMode}
        setViewMode={(mode) => {
          setViewMode(mode);
          if (isMobile) {
            setMobileView(mode === 'notes' ? 'notelist' : 'workspace');
          }
        }}
        folders={folders}
        selectedFolder={selectedFolder}
        setSelectedFolder={setSelectedFolder}
        tags={allTags}
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
        showFavoritesOnly={showFavoritesOnly}
        setShowFavoritesOnly={setShowFavoritesOnly}
        theme={theme}
        setTheme={setTheme}
        syncState={syncState}
        onNewFolder={handleNewFolder}
        onOpenVaultModal={() => {
          if (selectedNote) {
            handleLockVaultNote(selectedNote);
          } else {
            alert('Please select a note to encrypt/unlock.');
          }
        }}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        lang={lang}
        setLang={setLang}
        onImportObsidianNotes={handleImportObsidianNotes}
        onOpenDailyNote={() => handleNewNoteForDate(new Date().toISOString().slice(0, 10))}
      />
      )}

      {/* 2nd Column: Note List (Shown when in 'notes' mode) */}
      {(!isMobile || mobileView === 'notelist') && viewMode === 'notes' && (
        <div style={{ display: 'flex', flexDirection: 'column', width: isMobile ? '100%' : 'auto', height: '100%' }}>
          {isMobile && (
            <div style={{ padding: '8px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
              <button className="btn" aria-label="Open Menu" onClick={() => setMobileView('sidebar')}>
                ← Menu
              </button>
            </div>
          )}
        <NoteList
          notes={filteredNotes}
          selectedNoteId={selectedNoteId}
          onSelectNote={handleOpenNoteTab}
          onNewNote={handleNewNote}
          onNewCanvas={() => setViewMode('canvas')}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedFolder={selectedFolder}
          selectedTag={selectedTag}
          showFavoritesOnly={showFavoritesOnly}
          onToggleFavorite={handleToggleFavorite}
          lang={lang}
        />
        </div>
      )}

      {/* 3rd Main Workspace Column */}
      {(!isMobile || mobileView === 'workspace') && (
      <main style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {isMobile && (
          <div style={{ padding: '8px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
            <button className="btn" aria-label="Go back" onClick={() => setMobileView(viewMode === 'notes' ? 'notelist' : 'sidebar')}>
              ← Back
            </button>
          </div>
        )}

        <ErrorBoundary fallbackTitle="Workspace failed to load view">
          {viewMode === 'dashboard' && (
            <DashboardView
              notes={notes}
              onSelectNote={(id) => {
                handleOpenNoteTab(id);
                setViewMode('notes');
              }}
              onNewNote={handleNewNote}
              onNewCanvas={() => setViewMode('canvas')}
            />
          )}

          {viewMode === 'notes' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Top Workspace Tab Bar */}
              {openTabIds.length > 0 && (
                <div 
                  role="tablist"
                  aria-label="Open note tabs"
                  style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', padding: '4px 8px 0 8px', gap: '4px', overflowX: 'auto' }}
                >
                  {openTabIds.map(tId => {
                    const tNote = notes.find(n => n.id === tId);
                    if (!tNote) return null;
                    const isActive = tId === selectedNoteId;
                    return (
                      <div
                        key={tId}
                        role="tab"
                        aria-selected={isActive}
                        tabIndex={0}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: isActive ? '600' : '400',
                          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                          background: isActive ? 'var(--bg-primary)' : 'var(--bg-tertiary)',
                          borderTopLeftRadius: '8px',
                          borderTopRightRadius: '8px',
                          border: '1px solid var(--border-color)',
                          borderBottom: isActive ? '1px solid var(--bg-primary)' : '1px solid var(--border-color)',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                        onClick={() => setSelectedNoteId(tId)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedNoteId(tId);
                          }
                        }}
                      >
                        <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tNote.title}
                        </span>
                        <button
                          aria-label={`Close tab ${tNote.title}`}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0 2px', borderRadius: '50%' }}
                          onClick={(e) => handleCloseNoteTab(tId, e)}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                {/* Split View Toggle Button */}
                <button
                  className={`btn ${isSplitView ? 'btn-primary' : ''}`}
                  style={{ marginLeft: 'auto', padding: '4px 8px', fontSize: '11px' }}
                  onClick={() => {
                    setIsSplitView(!isSplitView);
                    if (!secondNoteId && openTabIds.length > 1) {
                      setSecondNoteId(openTabIds[1]);
                    }
                  }}
                  title="Toggle Split-Screen Dual Editor View"
                >
                  ⚡ {isSplitView ? 'Single View' : 'Split View'}
                </button>
              </div>
            )}

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              <div style={{ flex: 1, height: '100%', borderRight: isSplitView ? '1px solid var(--border-color)' : 'none' }}>
                <Editor
                  note={selectedNote}
                  folders={folders}
                  onUpdateNote={handleUpdateNote}
                  onDeleteNote={handleSoftDeleteNote}
                  allNotes={notes}
                  onSelectNoteByTitle={handleSelectNoteByTitle}
                  onLockVaultNote={handleLockVaultNote}
                  onOpenHistory={() => setHistoryModalOpen(true)}
                  lang={lang}
                />
              </div>

              {isSplitView && (
                <div style={{ flex: 1, height: '100%' }}>
                  <Editor
                    note={notes.find(n => n.id === (secondNoteId || openTabIds[1] || selectedNoteId)) || selectedNote}
                    folders={folders}
                    onUpdateNote={handleUpdateNote}
                    onDeleteNote={handleSoftDeleteNote}
                    allNotes={notes}
                    onSelectNoteByTitle={handleSelectNoteByTitle}
                    onLockVaultNote={handleLockVaultNote}
                    onOpenHistory={() => setHistoryModalOpen(true)}
                    lang={lang}
                  />
                </div>
              )}
            </div>
          </div>
        )}

          {viewMode === 'trash' && (
            <TrashBinView
              notes={notes}
              onRestoreNote={handleRestoreNote}
              onPermanentDeleteNote={handlePermanentDeleteNote}
              onEmptyTrash={handleEmptyTrash}
              lang={lang}
            />
          )}

          {viewMode === 'calendar' && (
            <CalendarView
              notes={notes}
              onSelectNote={(id) => {
                handleOpenNoteTab(id);
                setViewMode('notes');
              }}
              onNewNoteForDate={handleNewNoteForDate}
            />
          )}

          {viewMode === 'tasks' && (
            <TaskManager
              notes={notes}
              onUpdateNote={handleUpdateNote}
              lang={lang}
            />
          )}

          {viewMode === 'kanban' && (
            <KanbanView
              notes={notes}
              onSelectNote={(id) => {
                handleOpenNoteTab(id);
                setViewMode('notes');
              }}
              onUpdateNote={handleUpdateNote}
              onNewNote={handleNewNote}
              lang={lang}
            />
          )}

          {viewMode === 'canvas' && (
            <CanvasView notes={notes} onOpenNote={setSelectedNoteId} />
          )}

          {viewMode === 'graph' && (
            <GraphView notes={notes} onSelectNote={(id) => {
              handleOpenNoteTab(id);
              setViewMode('notes');
            }} />
          )}
        </ErrorBoundary>
      </main>
      )}

      {/* Encrypted Vault Modal */}
      <VaultModal
        note={targetVaultNote}
        isOpen={vaultModalOpen}
        onClose={() => setVaultModalOpen(false)}
        onSuccess={(updatedNote) => {
          handleUpdateNote(updatedNote);
        }}
        lang={lang}
      />

      {/* Global Command Palette Modal (Ctrl+P / Cmd+K) */}
      <CommandPaletteModal
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        notes={notes}
        onSelectNote={(id) => {
          handleOpenNoteTab(id);
          setViewMode('notes');
        }}
        onNewNote={handleNewNote}
        onSetViewMode={setViewMode}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />

      {/* Note Version History Modal */}
      <VersionHistoryModal
        note={selectedNote}
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        onRestoreSnapshot={handleRestoreSnapshot}
        lang={lang}
      />

      {/* Shortcuts Cheat Sheet Modal */}
      <ShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
        lang={lang}
      />

      {/* Global Toast System */}
      <ToastContainer />
    </div>
  );
};
