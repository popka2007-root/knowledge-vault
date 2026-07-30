import React, { useRef } from 'react';
import { 
  FileText, FolderPlus, Tag, Shield, 
  Sun, Moon, RefreshCw, Layers, GitFork, Command, Globe, 
  LayoutDashboard, Calendar, CheckSquare, Upload, Download, Trash2, Kanban
} from 'lucide-react';
import { Folder, ViewMode, Theme, SyncState, Note } from '../types';
import { Language, t } from '../utils/i18n';
import { exportVaultToObsidianZip, parseObsidianNote } from '../utils/obsidianSync';
import { exportVaultToJSON } from '../utils/export';
import { FolderTree } from './FolderTree';

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
  onNewSubFolder?: (parentId: string) => void;
  onRenameFolder?: (folderId: string, currentName: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  onOpenVaultModal: () => void;
  onOpenCommandPalette: () => void;
  lang: Language;
  setLang: (lang: Language) => void;
  onImportObsidianNotes: (notes: Note[]) => void;
  onOpenDailyNote?: () => void;
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
  onNewSubFolder,
  onRenameFolder,
  onDeleteFolder,
  onOpenVaultModal,
  onOpenCommandPalette,
  lang,
  setLang,
  onImportObsidianNotes,
  onOpenDailyNote
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportObsidian = () => {
    try {
      exportVaultToObsidianZip(notes, folders);
    } catch (err) {
      console.error('Failed to export vault:', err);
      alert('Failed to export vault. Please check console.');
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const importedList: Note[] = [];
      let readCount = 0;
      const totalFiles = files.length;
      
      const checkComplete = () => {
        if (readCount === totalFiles) {
          if (importedList.length > 0) {
            onImportObsidianNotes(importedList);
            alert(`Successfully imported ${importedList.length} notes from Obsidian!`);
          } else {
            alert('No valid Markdown notes were imported.');
          }
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };

      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        const reader = new FileReader();
        
        reader.onload = (event) => {
          try {
            const text = event.target?.result as string;
            if (text) {
              const parsed = parseObsidianNote(file.name, text);
              importedList.push(parsed);
            }
          } catch (err) {
            console.error(`Failed to parse file ${file.name}:`, err);
          } finally {
            readCount++;
            checkComplete();
          }
        };

        reader.onerror = (err) => {
          console.error(`Failed to read file ${file.name}:`, err);
          readCount++;
          checkComplete();
        };

        reader.readAsText(file);
      }
    }
  };

  return (
    <aside 
      className="glass-panel" 
      aria-label="Main Navigation Sidebar"
      style={{ width: 'var(--sidebar-width)', height: '100%', display: 'flex', flexDirection: 'column', padding: '16px 12px' }}
    >
      {/* Header with Title & Language Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', padding: '0 4px' }}>
        <div>
          <h1 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.3px', margin: 0 }}>
            {t('appTitle', lang)}
          </h1>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{t('appSubtitle', lang)}</p>
        </div>

        {/* Styled Language Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Globe size={14} style={{ color: 'var(--text-secondary)' }} aria-hidden="true" />
          <select 
            value={lang} 
            onChange={(e) => setLang(e.target.value as Language)}
            aria-label="Select Interface Language"
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
          </select>
        </div>
      </div>

      {/* Main Workspace Navigation Modes */}
      <nav 
        aria-label="Workspace Views"
        style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '20px' }}
      >
        <button
          className={`btn ${viewMode === 'dashboard' ? 'btn-primary' : ''}`}
          aria-current={viewMode === 'dashboard' ? 'page' : undefined}
          style={{ justifyContent: 'flex-start', width: '100%' }}
          onClick={() => setViewMode('dashboard')}
        >
          <LayoutDashboard size={16} aria-hidden="true" />
          <span>{t('dashboardView', lang)}</span>
        </button>

        <button
          className={`btn ${viewMode === 'notes' && !showFavoritesOnly && !selectedFolder && !selectedTag ? 'btn-primary' : ''}`}
          aria-current={viewMode === 'notes' && !showFavoritesOnly && !selectedFolder && !selectedTag ? 'page' : undefined}
          style={{ justifyContent: 'flex-start', width: '100%' }}
          onClick={() => {
            setViewMode('notes');
            setSelectedFolder(null);
            setSelectedTag(null);
            setShowFavoritesOnly(false);
          }}
        >
          <FileText size={16} aria-hidden="true" />
          <span>{t('allNotes', lang)}</span>
        </button>

        <button
          className={`btn ${viewMode === 'calendar' ? 'btn-primary' : ''}`}
          aria-current={viewMode === 'calendar' ? 'page' : undefined}
          style={{ justifyContent: 'flex-start', width: '100%' }}
          onClick={() => setViewMode('calendar')}
        >
          <Calendar size={16} aria-hidden="true" />
          <span>{t('calendarView', lang)}</span>
        </button>

        <button
          className={`btn ${viewMode === 'tasks' ? 'btn-primary' : ''}`}
          aria-current={viewMode === 'tasks' ? 'page' : undefined}
          style={{ justifyContent: 'flex-start', width: '100%' }}
          onClick={() => setViewMode('tasks')}
        >
          <CheckSquare size={16} aria-hidden="true" />
          <span>{t('taskManagerView', lang)}</span>
        </button>

        <button
          className={`btn ${viewMode === 'kanban' ? 'btn-primary' : ''}`}
          aria-current={viewMode === 'kanban' ? 'page' : undefined}
          style={{ justifyContent: 'flex-start', width: '100%' }}
          onClick={() => setViewMode('kanban')}
        >
          <Kanban size={16} aria-hidden="true" />
          <span>{lang === 'ru' ? 'Канбан доска' : 'Kanban Board'}</span>
        </button>

        <button
          className={`btn ${viewMode === 'canvas' ? 'btn-primary' : ''}`}
          aria-current={viewMode === 'canvas' ? 'page' : undefined}
          style={{ justifyContent: 'flex-start', width: '100%' }}
          onClick={() => setViewMode('canvas')}
        >
          <Layers size={16} aria-hidden="true" />
          <span>{t('visualCanvas', lang)}</span>
        </button>

        <button
          className={`btn ${viewMode === 'graph' ? 'btn-primary' : ''}`}
          aria-current={viewMode === 'graph' ? 'page' : undefined}
          style={{ justifyContent: 'flex-start', width: '100%' }}
          onClick={() => setViewMode('graph')}
        >
          <GitFork size={16} aria-hidden="true" />
          <span>{t('graphView', lang)}</span>
        </button>

        <button
          className={`btn ${viewMode === 'trash' ? 'btn-primary' : ''}`}
          aria-current={viewMode === 'trash' ? 'page' : undefined}
          style={{ justifyContent: 'flex-start', width: '100%', color: viewMode === 'trash' ? '#fff' : 'var(--danger)' }}
          onClick={() => setViewMode('trash')}
        >
          <Trash2 size={16} aria-hidden="true" />
          <span>{lang === 'ru' ? 'Корзина' : 'Trash Bin'}</span>
        </button>
      </nav>

      {/* Obsidian Vault Bi-Directional Sync */}
      <div style={{ marginBottom: '20px', padding: '10px', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
          Obsidian Vault
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button 
            className="btn" 
            aria-label="Export Obsidian Vault"
            style={{ flex: 1, padding: '4px 8px', fontSize: '11px' }} 
            onClick={handleExportObsidian}
          >
            <Download size={12} aria-hidden="true" />
            <span>{lang === 'ru' ? 'Экспорт' : 'Export'}</span>
          </button>
          <button 
            className="btn" 
            aria-label="Import Obsidian Markdown Notes"
            style={{ flex: 1, padding: '4px 8px', fontSize: '11px' }} 
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={12} aria-hidden="true" />
            <span>{lang === 'ru' ? 'Импорт' : 'Import'}</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileImport} 
            multiple 
            accept=".md,.markdown" 
            aria-label="Obsidian markdown files input"
            style={{ display: 'none' }} 
          />
        </div>
      </div>

      {/* Folders Section with FolderTree */}
      <div style={{ marginBottom: '20px', flex: 1, overflowY: 'auto' }}>
        <FolderTree
          folders={folders}
          selectedFolder={selectedFolder}
          onSelectFolder={(fId) => {
            setViewMode('notes');
            setSelectedFolder(fId);
            setSelectedTag(null);
          }}
          onNewFolder={onNewFolder}
          onNewSubFolder={onNewSubFolder}
          onRenameFolder={onRenameFolder}
          onDeleteFolder={onDeleteFolder}
          lang={lang}
        />
      </div>

        {/* Tags Section */}
        <div style={{ marginTop: '20px' }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', padding: '0 4px', marginBottom: '8px' }}>
            {t('tags', lang)}
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '0 4px' }}>
            {tags.map(tag => (
              <button
                key={tag}
                className="tag-badge"
                aria-label={`Filter by tag ${tag}`}
                style={{
                  background: selectedTag === tag ? 'rgba(31, 111, 235, 0.4)' : undefined,
                  borderColor: selectedTag === tag ? 'var(--border-focus)' : undefined,
                  cursor: 'pointer',
                  border: '1px solid transparent',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onClick={() => {
                  setViewMode('notes');
                  setSelectedTag(tag);
                  setSelectedFolder(null);
                }}
              >
                <Tag size={10} aria-hidden="true" />
                #{tag}
              </button>
            ))}
          </div>
        </div>

      {/* Footer System Status & Command Palette Trigger */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button 
            className="btn" 
            aria-label="Open Command Palette (Ctrl+P)"
            style={{ flex: 1, justifyContent: 'space-between', fontSize: '11px' }} 
            onClick={onOpenCommandPalette}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Command size={13} aria-hidden="true" />
              <span>{lang === 'ru' ? 'Палитра' : 'Palette'}</span>
            </div>
            <span style={{ color: 'var(--text-muted)', background: 'var(--bg-primary)', padding: '1px 4px', borderRadius: '4px' }}>Ctrl+P</span>
          </button>

          <button
            className="btn"
            style={{ padding: '4px 8px', fontSize: '11px' }}
            onClick={() => exportVaultToJSON(notes, folders)}
            title={lang === 'ru' ? 'Экспорт полной JSON резервной копии' : 'Export Full JSON Backup'}
          >
            {lang === 'ru' ? 'Копия' : 'Backup'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <RefreshCw size={12} className={syncState === 'syncing' ? 'spin' : ''} aria-hidden="true" />
            <span>{syncState === 'synced' ? t('serverSynced', lang) : t('localFirst', lang)}</span>
          </div>

          <button
            className="btn-icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle Light/Dark Theme"
            aria-label="Toggle light or dark theme"
          >
            {theme === 'dark' ? <Sun size={15} aria-hidden="true" /> : <Moon size={15} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </aside>
  );
};
