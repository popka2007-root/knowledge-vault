import React, { useState } from 'react';
import { 
  FileText, 
  LayoutGrid, 
  Share2, 
  Folder as FolderIcon, 
  Tag as TagIcon, 
  Lock, 
  Moon, 
  Sun, 
  Plus, 
  Cloud, 
  CloudOff, 
  Star,
  ChevronRight,
  ChevronDown,
  Globe,
  Download,
  Upload,
  Calendar,
  CheckSquare,
  LayoutDashboard,
  Terminal
} from 'lucide-react';
import { Folder as FolderType, ViewMode, Theme, SyncState, Note } from '../types';
import { Language, t } from '../utils/i18n';
import { exportVaultToObsidianZip } from '../utils/obsidianSync';

interface SidebarProps {
  notes: Note[];
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  folders: FolderType[];
  selectedFolder: string | null;
  setSelectedFolder: (folderId: string | null) => void;
  tags: string[];
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (favOnly: boolean) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  syncState: SyncState;
  onNewFolder: () => void;
  onOpenVaultModal: () => void;
  onOpenCommandPalette: () => void;
  lang: Language;
  setLang: (lang: Language) => void;
  onImportObsidianNotes: (importedNotes: Note[]) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  notes,
  viewMode,
  setViewMode,
  folders,
  selectedFolder,
  setSelectedFolder,
  tags,
  selectedTag,
  setSelectedTag,
  showFavoritesOnly,
  setShowFavoritesOnly,
  theme,
  setTheme,
  syncState,
  onNewFolder,
  onOpenVaultModal,
  onOpenCommandPalette,
  lang,
  setLang,
  onImportObsidianNotes
}) => {
  const [foldersOpen, setFoldersOpen] = useState(true);
  const [tagsOpen, setTagsOpen] = useState(true);

  const handleObsidianFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = event.target?.result as string;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const imported: Note[] = parsed.map((item: any, i: number) => ({
            id: `note-obsidian-${Date.now()}-${i}`,
            title: item.fileName ? item.fileName.replace(/\.md$/, '') : `Obsidian Note ${i + 1}`,
            content: item.content || '',
            folder: '',
            tags: ['obsidian'],
            isEncrypted: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isFavorite: false
          }));
          onImportObsidianNotes(imported);
          alert(`Successfully imported ${imported.length} notes from Obsidian vault backup!`);
        }
      } catch (err) {
        alert('Invalid Obsidian vault export JSON format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <aside className="glass-panel" style={{ width: 'var(--sidebar-width)', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header / App Brand */}
      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #1f6feb, #a371f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
            KV
          </div>
          <div>
            <h1 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', lineHeight: 1.2 }}>{t('appTitle', lang)}</h1>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('appSubtitle', lang)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Language Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '6px' }}>
            <Globe size={13} color="var(--text-muted)" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Language)}
              style={{ background: 'transparent', color: 'var(--text-primary)', border: 'none', fontSize: '11px', outline: 'none', cursor: 'pointer', fontWeight: '600' }}
            >
              <option value="ru">RU</option>
              <option value="en">EN</option>
              <option value="de">DE</option>
              <option value="es">ES</option>
              <option value="fr">FR</option>
            </select>
          </div>

          <button 
            className="btn-icon" 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>

      {/* Primary Workspace Navigation Views */}
      <div style={{ padding: '12px 8px', borderBottom: '1px solid var(--border-color)' }}>
        <button 
          className={`btn ${viewMode === 'dashboard' ? 'btn-primary' : ''}`}
          onClick={() => setViewMode('dashboard')}
          style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '4px' }}
        >
          <LayoutDashboard size={16} color="#a371f7" />
          <span>Dashboard</span>
        </button>

        <button 
          className={`btn ${viewMode === 'notes' && !showFavoritesOnly && selectedFolder === null && selectedTag === null ? 'btn-primary' : ''}`}
          onClick={() => {
            setViewMode('notes');
            setSelectedFolder(null);
            setSelectedTag(null);
            setShowFavoritesOnly(false);
          }}
          style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '4px' }}
        >
          <FileText size={16} />
          <span>{t('allNotes', lang)}</span>
        </button>

        <button 
          className={`btn ${viewMode === 'calendar' ? 'btn-primary' : ''}`}
          onClick={() => setViewMode('calendar')}
          style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '4px' }}
        >
          <Calendar size={16} color="#388bfd" />
          <span>Calendar</span>
        </button>

        <button 
          className={`btn ${viewMode === 'tasks' ? 'btn-primary' : ''}`}
          onClick={() => setViewMode('tasks')}
          style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '4px' }}
        >
          <CheckSquare size={16} color="var(--success)" />
          <span>Tasks & Habits</span>
        </button>

        <button 
          className={`btn ${viewMode === 'canvas' ? 'btn-primary' : ''}`}
          onClick={() => setViewMode('canvas')}
          style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '4px' }}
        >
          <LayoutGrid size={16} />
          <span>{t('visualCanvas', lang)}</span>
        </button>

        <button 
          className={`btn ${viewMode === 'graph' ? 'btn-primary' : ''}`}
          onClick={() => setViewMode('graph')}
          style={{ width: '100%', justifyContent: 'flex-start' }}
        >
          <Share2 size={16} />
          <span>{t('graphView', lang)}</span>
        </button>
      </div>

      {/* Scrollable Tree Section: Folders & Tags */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
        {/* Command Palette Trigger Button */}
        <button 
          className="btn" 
          onClick={onOpenCommandPalette} 
          style={{ width: '100%', justifyContent: 'space-between', marginBottom: '12px', fontSize: '11.5px', background: 'var(--bg-tertiary)' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Terminal size={14} /> Palette</span>
          <span style={{ fontSize: '10px', opacity: 0.6, background: 'var(--bg-primary)', padding: '1px 5px', borderRadius: '3px' }}>Ctrl+P</span>
        </button>

        {/* Folders Accordion */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <span 
              onClick={() => setFoldersOpen(!foldersOpen)} 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {foldersOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              {t('folders', lang)}
            </span>
            <button className="btn-icon" style={{ padding: '2px' }} onClick={onNewFolder} title="New Folder">
              <Plus size={14} />
            </button>
          </div>

          {foldersOpen && (
            <div style={{ marginTop: '4px' }}>
              {folders.map(folder => (
                <div 
                  key={folder.id}
                  onClick={() => {
                    setSelectedFolder(folder.id);
                    setSelectedTag(null);
                    setShowFavoritesOnly(false);
                    setViewMode('notes');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    background: selectedFolder === folder.id ? 'var(--bg-hover)' : 'transparent',
                    color: selectedFolder === folder.id ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}
                >
                  <FolderIcon size={15} color="var(--accent-hover)" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{folder.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tags Accordion */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <span 
              onClick={() => setTagsOpen(!tagsOpen)} 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {tagsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              {t('tags', lang)}
            </span>
          </div>

          {tagsOpen && (
            <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {tags.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '6px 12px' }}>No tags yet</div>
              ) : (
                tags.map(tag => (
                  <div
                    key={tag}
                    onClick={() => {
                      setSelectedTag(selectedTag === tag ? null : tag);
                      setSelectedFolder(null);
                      setShowFavoritesOnly(false);
                      setViewMode('notes');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      background: selectedTag === tag ? 'var(--bg-hover)' : 'transparent',
                      color: selectedTag === tag ? 'var(--accent-hover)' : 'var(--text-secondary)'
                    }}
                  >
                    <TagIcon size={14} />
                    <span>#{tag}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button 
            className="btn" 
            onClick={() => exportVaultToObsidianZip(notes, folders)}
            style={{ flex: 1, fontSize: '11px', padding: '5px 8px', justifyContent: 'center' }}
            title="Export all notes in Obsidian Vault Format"
          >
            <Download size={13} color="#e3b341" />
            <span>Obsidian Export</span>
          </button>

          <label 
            className="btn" 
            style={{ fontSize: '11px', padding: '5px 8px', justifyContent: 'center', cursor: 'pointer' }}
            title="Import Obsidian Vault JSON Backup"
          >
            <Upload size={13} color="#2ea043" />
            <input type="file" accept=".json" onChange={handleObsidianFileImport} style={{ display: 'none' }} />
            <span>Import</span>
          </label>
        </div>

        <button 
          className="btn" 
          onClick={onOpenVaultModal}
          style={{ width: '100%', justifyContent: 'center', borderColor: 'var(--vault-purple)', color: 'var(--vault-purple)' }}
        >
          <Lock size={14} />
          <span>{t('encryptedVault', lang)}</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', padding: '0 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {syncState === 'synced' || syncState === 'idle' ? (
              <Cloud size={14} color="var(--success)" />
            ) : (
              <CloudOff size={14} color="var(--text-muted)" />
            )}
            <span>{syncState === 'synced' ? t('serverSynced', lang) : t('localFirst', lang)}</span>
          </div>
          <span>v2.0 Enterprise</span>
        </div>
      </div>
    </aside>
  );
};
