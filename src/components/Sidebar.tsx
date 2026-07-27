import React, { useRef } from 'react';
import { 
  FileText, FolderPlus, Tag, Shield, 
  Sun, Moon, RefreshCw, Layers, GitFork, Command, Globe, 
  LayoutDashboard, Calendar, CheckSquare, Upload, Download
} from 'lucide-react';
import { Folder, ViewMode, Theme, SyncState, Note } from '../types';
import { Language, t } from '../utils/i18n';
import { exportVaultToObsidianZip, parseObsidianNote } from '../utils/obsidianSync';

interface SidebarProps {
  notes: Note[];
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  folders: Folder[];
  selectedFolder: string | null;
  setSelectedFolder: (folderId: string | null) => void;
  tags: string[];
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (show: boolean) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  syncState: SyncState;
  onNewFolder: () => void;
  onOpenVaultModal: () => void;
  onOpenCommandPalette: () => void;
  lang: Language;
  setLang: (lang: Language) => void;
  onImportObsidianNotes: (notes: Note[]) => void;
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportObsidian = () => {
    exportVaultToObsidianZip(notes, folders);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const importedList: Note[] = [];
      let readCount = 0;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          if (text) {
            const parsed = parseObsidianNote(file.name, text);
            importedList.push(parsed);
          }
          readCount++;
          if (readCount === files.length) {
            onImportObsidianNotes(importedList);
            alert(`Successfully imported ${importedList.length} notes from Obsidian!`);
          }
        };
        reader.readAsText(file);
      }
    }
  };

  return (
    <aside className="glass-panel" style={{ width: 'var(--sidebar-width)', height: '100%', display: 'flex', flexDirection: 'column', padding: '16px 12px' }}>
      {/* Header with Title & Language Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', padding: '0 4px' }}>
        <div>
          <h1 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            {t('appTitle', lang)}
          </h1>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('appSubtitle', lang)}</p>
        </div>

        {/* Styled Language Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Globe size={14} style={{ color: 'var(--text-secondary)' }} />
          <select 
            value={lang} 
            onChange={(e) => setLang(e.target.value as Language)}
            style={{
              fontSize: '11px',
              fontWeight: '600',
              padding: '2px 6px',
              borderRadius: '6px',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer'
            }}
          >
            <option value="ru">RU</option>
            <option value="en">EN</option>
            <option value="de">DE</option>
            <option value="es">ES</option>
            <option value="fr">FR</option>
          </select>
        </div>
      </div>

      {/* Main Workspace Navigation Modes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '20px' }}>
        <button
          className={`btn ${viewMode === 'dashboard' ? 'btn-primary' : ''}`}
          style={{ justifyContent: 'flex-start', width: '100%' }}
          onClick={() => setViewMode('dashboard')}
        >
          <LayoutDashboard size={16} />
          <span>{t('dashboardView', lang)}</span>
        </button>

        <button
          className={`btn ${viewMode === 'notes' && !showFavoritesOnly && !selectedFolder && !selectedTag ? 'btn-primary' : ''}`}
          style={{ justifyContent: 'flex-start', width: '100%' }}
          onClick={() => {
            setViewMode('notes');
            setSelectedFolder(null);
            setSelectedTag(null);
            setShowFavoritesOnly(false);
          }}
        >
          <FileText size={16} />
          <span>{t('allNotes', lang)}</span>
        </button>

        <button
          className={`btn ${viewMode === 'calendar' ? 'btn-primary' : ''}`}
          style={{ justifyContent: 'flex-start', width: '100%' }}
          onClick={() => setViewMode('calendar')}
        >
          <Calendar size={16} />
          <span>{t('calendarView', lang)}</span>
        </button>

        <button
          className={`btn ${viewMode === 'tasks' ? 'btn-primary' : ''}`}
          style={{ justifyContent: 'flex-start', width: '100%' }}
          onClick={() => setViewMode('tasks')}
        >
          <CheckSquare size={16} />
          <span>{t('taskManagerView', lang)}</span>
        </button>

        <button
          className={`btn ${viewMode === 'canvas' ? 'btn-primary' : ''}`}
          style={{ justifyContent: 'flex-start', width: '100%' }}
          onClick={() => setViewMode('canvas')}
        >
          <Layers size={16} />
          <span>{t('visualCanvas', lang)}</span>
        </button>

        <button
          className={`btn ${viewMode === 'graph' ? 'btn-primary' : ''}`}
          style={{ justifyContent: 'flex-start', width: '100%' }}
          onClick={() => setViewMode('graph')}
        >
          <GitFork size={16} />
          <span>{t('graphView', lang)}</span>
        </button>
      </div>

      {/* Obsidian Vault Bi-Directional Sync */}
      <div style={{ marginBottom: '20px', padding: '10px', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
          Obsidian Vault
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="btn" style={{ flex: 1, padding: '4px 8px', fontSize: '11px' }} onClick={handleExportObsidian}>
            <Download size={12} />
            <span>Export</span>
          </button>
          <button className="btn" style={{ flex: 1, padding: '4px 8px', fontSize: '11px' }} onClick={() => fileInputRef.current?.click()}>
            <Upload size={12} />
            <span>Import</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileImport} 
            multiple 
            accept=".md,.markdown" 
            style={{ display: 'none' }} 
          />
        </div>
      </div>

      {/* Folders Section */}
      <div style={{ marginBottom: '20px', flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            {t('folders', lang)}
          </span>
          <button className="btn-icon" onClick={onNewFolder} title="New Folder">
            <FolderPlus size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {folders.map(folder => (
            <button
              key={folder.id}
              className="btn"
              style={{
                justifyContent: 'flex-start',
                width: '100%',
                background: selectedFolder === folder.id ? 'var(--bg-hover)' : 'transparent',
                border: 'none',
                color: selectedFolder === folder.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '12px'
              }}
              onClick={() => {
                setViewMode('notes');
                setSelectedFolder(folder.id);
                setSelectedTag(null);
              }}
            >
              <FolderPlus size={14} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{folder.name}</span>
            </button>
          ))}
        </div>

        {/* Tags Section */}
        <div style={{ marginTop: '20px' }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', padding: '0 4px', marginBottom: '8px' }}>
            {t('tags', lang)}
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '0 4px' }}>
            {tags.map(tag => (
              <span
                key={tag}
                className="tag-badge"
                style={{
                  background: selectedTag === tag ? 'rgba(31, 111, 235, 0.4)' : undefined,
                  borderColor: selectedTag === tag ? 'var(--border-focus)' : undefined
                }}
                onClick={() => {
                  setViewMode('notes');
                  setSelectedTag(tag);
                  setSelectedFolder(null);
                }}
              >
                <Tag size={10} />
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer System Status & Command Palette Trigger */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button className="btn" style={{ width: '100%', justifyContent: 'space-between', fontSize: '11px' }} onClick={onOpenCommandPalette}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Command size={13} />
            <span>Command Palette</span>
          </div>
          <span style={{ color: 'var(--text-muted)', background: 'var(--bg-primary)', padding: '1px 5px', borderRadius: '4px' }}>Ctrl+P</span>
        </button>

        <button className="btn" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={onOpenVaultModal}>
          <Shield size={16} style={{ color: 'var(--vault-purple)' }} />
          <span>{t('encryptedVault', lang)}</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <RefreshCw size={12} className={syncState === 'syncing' ? 'spin' : ''} />
            <span>{syncState === 'synced' ? t('serverSynced', lang) : t('localFirst', lang)}</span>
          </div>

          <button
            className="btn-icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </div>
    </aside>
  );
};
