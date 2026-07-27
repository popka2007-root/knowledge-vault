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
import { Note, Folder, ViewMode, Theme, SyncState } from './types';
import { extractTags } from './utils/crypto';
import { Language } from './utils/i18n';
import { processTemplate, DEFAULT_TEMPLATES } from './modules/templater/templateEngine';

// Initial Demo Seed Notes showcasing rich formatting
const INITIAL_NOTES: Note[] = [
  {
    id: 'note-emotions',
    title: 'Emotions',
    content: `# Emotions

*Perhaps it is our emotions. How **strong** they are? How <u>lively</u>, vigorous and energetic. When anger burns in our veins, thoughts are in a torrent, all thrown here and there, helpless at the mercy of a <mark style="background:rgba(56,139,253,0.4); color:#fff; padding:2px 4px; border-radius:3px;">ferocious beast</mark>. Or when love drives us mad, where are these thoughts? Why don't they turn this madness around? Why don't they argue on their behalf to the stubborn barbarian horde that destroys the order and magnificence of their peaceful, calm cities?*

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
      { id: 't3', title: 'Create LaTeX formulas', completed: false, dueDate: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(), priority: 'P1', createdAt: Date.now() }
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
    const saved = localStorage.getItem('kv_notes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_NOTES;
      }
    }
    return INITIAL_NOTES;
  });

  const [folders, setFolders] = useState<Folder[]>(() => {
    const saved = localStorage.getItem('kv_folders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_FOLDERS;
      }
    }
    return INITIAL_FOLDERS;
  });

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(INITIAL_NOTES[0].id);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [theme, setTheme] = useState<Theme>('dark');
  const [syncState, setSyncState] = useState<SyncState>('synced');
  
  // Modals
  const [vaultModalOpen, setVaultModalOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [targetVaultNote, setTargetVaultNote] = useState<Note | null>(null);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('kv_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('kv_folders', JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'k')) {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const allTags = Array.from(new Set(notes.flatMap(n => n.tags)));

  const filteredNotes = notes.filter(note => {
    if (showFavoritesOnly && !note.isFavorite) return false;
    if (selectedFolder && note.folder !== selectedFolder) return false;
    if (selectedTag && !note.tags.includes(selectedTag)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = note.title.toLowerCase().includes(q);
      const matchContent = note.content.toLowerCase().includes(q);
      const matchTags = note.tags.some(t => t.toLowerCase().includes(q));
      return matchTitle || matchContent || matchTags;
    }
    return true;
  });

  const selectedNote = notes.find(n => n.id === selectedNoteId) || (notes.length > 0 ? notes[0] : null);

  const handleNewNote = () => {
    const defaultTemplate = DEFAULT_TEMPLATES[0].content;
    const processedContent = processTemplate(defaultTemplate, 'Untitled Note', notes);

    const newNote: Note = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `note-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
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
    setSelectedNoteId(newNote.id);
    setViewMode('notes');
  };

  const handleNewNoteForDate = (dateStr: string) => {
    const journalTitle = `Daily Journal — ${dateStr}`;
    const existing = notes.find(n => n.title.toLowerCase() === journalTitle.toLowerCase());
    if (existing) {
      setSelectedNoteId(existing.id);
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
    setSelectedNoteId(newNote.id);
    setViewMode('notes');
  };

  const handleUpdateNote = (updated: Note) => {
    setNotes(notes.map(n => n.id === updated.id ? updated : n));
  };

  const handleDeleteNote = (id: string) => {
    const remaining = notes.filter(n => n.id !== id);
    setNotes(remaining);
    setSelectedNoteId(remaining.length > 0 ? remaining[0].id : null);
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
    const target = notes.find(n => n.title.toLowerCase().trim() === title.toLowerCase().trim());
    if (target) {
      setSelectedNoteId(target.id);
      setViewMode('notes');
    } else {
      const newNote: Note = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `note-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
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
      setSelectedNoteId(newNote.id);
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
      setSelectedNoteId(importedNotes[0].id);
    }
  };

  return (
    <div className="app-container">
      {/* 1st Column: Sidebar Navigation */}
      <Sidebar
        notes={notes}
        viewMode={viewMode}
        setViewMode={setViewMode}
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
      />

      {/* 2nd Column: Note List (Shown when in 'notes' mode) */}
      {viewMode === 'notes' && (
        <NoteList
          notes={filteredNotes}
          selectedNoteId={selectedNoteId}
          onSelectNote={setSelectedNoteId}
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
      )}

      {/* 3rd Main Workspace Column */}
      <main style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {viewMode === 'dashboard' && (
          <DashboardView
            notes={notes}
            onSelectNote={(id) => {
              setSelectedNoteId(id);
              setViewMode('notes');
            }}
            onNewNote={handleNewNote}
            onNewCanvas={() => setViewMode('canvas')}
          />
        )}

        {viewMode === 'notes' && (
          <Editor
            note={selectedNote}
            folders={folders}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
            allNotes={notes}
            onSelectNoteByTitle={handleSelectNoteByTitle}
            onLockVaultNote={handleLockVaultNote}
            lang={lang}
          />
        )}

        {viewMode === 'calendar' && (
          <CalendarView
            notes={notes}
            onSelectNote={(id) => {
              setSelectedNoteId(id);
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

        {viewMode === 'canvas' && (
          <CanvasView notes={notes} onOpenNote={setSelectedNoteId} />
        )}

        {viewMode === 'graph' && (
          <GraphView notes={notes} onSelectNote={(id) => {
            setSelectedNoteId(id);
            setViewMode('notes');
          }} />
        )}
      </main>

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
        onSelectNote={setSelectedNoteId}
        onNewNote={handleNewNote}
        onSetViewMode={setViewMode}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />
    </div>
  );
};
