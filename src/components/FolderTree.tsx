import React, { useState } from 'react';
import { FolderPlus, ChevronRight, ChevronDown, Folder as FolderIcon, Edit2, Trash2, Plus } from 'lucide-react';
import { Folder } from '../types';
import { Language, t } from '../utils/i18n';

export interface FolderTreeProps {
  folders: Folder[];
  selectedFolder: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onNewFolder: () => void;
  onNewSubFolder?: (parentId: string) => void;
  onRenameFolder?: (folderId: string, currentName: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  lang: Language;
}

interface FolderNodeProps {
  folder: Folder;
  allFolders: Folder[];
  selectedFolder: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onNewSubFolder?: (parentId: string) => void;
  onRenameFolder?: (folderId: string, currentName: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  depth: number;
}

const FolderNode: React.FC<FolderNodeProps> = ({
  folder,
  allFolders,
  selectedFolder,
  onSelectFolder,
  onNewSubFolder,
  onRenameFolder,
  onDeleteFolder,
  expandedIds,
  onToggleExpand,
  depth
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const children = allFolders.filter(f => f.parentId === folder.id);
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds.has(folder.id);
  const isSelected = selectedFolder === folder.id;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentTarget = e.currentTarget as HTMLElement;
    const treeRoot = currentTarget.closest('[role="tree"]');
    if (!treeRoot) return;

    const items = Array.from(treeRoot.querySelectorAll('[role="treeitem"]')) as HTMLElement[];
    const index = items.indexOf(currentTarget);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (index >= 0 && index < items.length - 1) {
        items[index + 1].focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (index > 0) {
        items[index - 1].focus();
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (hasChildren && !isExpanded) {
        onToggleExpand(folder.id);
      } else if (hasChildren && isExpanded && index >= 0 && index < items.length - 1) {
        items[index + 1].focus();
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (hasChildren && isExpanded) {
        onToggleExpand(folder.id);
      } else {
        const parentGroup = currentTarget.closest('[role="group"]');
        if (parentGroup) {
          const parentItem = parentGroup.parentElement?.querySelector(':scope > [role="treeitem"]') as HTMLElement;
          if (parentItem) {
            parentItem.focus();
          }
        }
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectFolder(folder.id);
    }
  };

  return (
    <div className="folder-tree-node-wrapper">
      <div
        role="treeitem"
        tabIndex={0}
        aria-label={folder.name}
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-selected={isSelected}
        className={`folder-tree-item ${isSelected ? 'selected' : ''}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 6px',
          paddingLeft: `${Math.max(6, depth * 12)}px`,
          borderRadius: '6px',
          fontSize: depth > 0 ? '11px' : '12px',
          color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
          background: isSelected ? 'var(--bg-hover)' : isHovered ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
          cursor: 'pointer',
          userSelect: 'none',
          outline: 'none',
          transition: 'background 0.15s ease'
        }}
        onClick={() => onSelectFolder(folder.id)}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {hasChildren ? (
          <button
            type="button"
            className="btn-icon"
            aria-label={isExpanded ? `Collapse ${folder.name}` : `Expand ${folder.name}`}
            style={{ padding: 0, width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(folder.id);
            }}
          >
            {isExpanded ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
          </button>
        ) : (
          <FolderIcon size={14} style={{ opacity: 0.7 }} aria-hidden="true" />
        )}

        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {folder.name}
        </span>

        {/* Hover Action Buttons: Add Subfolder, Rename, Delete */}
        {(isHovered || isSelected) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} onClick={(e) => e.stopPropagation()}>
            {onNewSubFolder && (
              <button
                type="button"
                className="btn-icon"
                title="Create Subfolder"
                aria-label={`Create Subfolder inside ${folder.name}`}
                style={{ padding: '2px' }}
                onClick={() => onNewSubFolder(folder.id)}
              >
                <Plus size={12} aria-hidden="true" />
              </button>
            )}

            {onRenameFolder && (
              <button
                type="button"
                className="btn-icon"
                title="Rename Folder"
                aria-label={`Rename Folder ${folder.name}`}
                style={{ padding: '2px' }}
                onClick={() => onRenameFolder(folder.id, folder.name)}
              >
                <Edit2 size={12} aria-hidden="true" />
              </button>
            )}

            {onDeleteFolder && (
              <button
                type="button"
                className="btn-icon"
                title="Delete Folder"
                aria-label={`Delete Folder ${folder.name}`}
                style={{ padding: '2px', color: 'var(--danger)' }}
                onClick={() => onDeleteFolder(folder.id)}
              >
                <Trash2 size={12} aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div role="group" className="folder-tree-group">
          {children.map(child => (
            <FolderNode
              key={child.id}
              folder={child}
              allFolders={allFolders}
              selectedFolder={selectedFolder}
              onSelectFolder={onSelectFolder}
              onNewSubFolder={onNewSubFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FolderTree: React.FC<FolderTreeProps> = ({
  folders,
  selectedFolder,
  onSelectFolder,
  onNewFolder,
  onNewSubFolder,
  onRenameFolder,
  onDeleteFolder,
  lang
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(folders.map(f => f.id)));

  const handleToggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Find root folders (parentId is null or parentId does not exist in folders list)
  const rootFolders = folders.filter(f => !f.parentId || !folders.some(parent => parent.id === f.parentId));

  return (
    <div className="folder-tree-container" style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          {t('folders', lang)}
        </span>
        <button className="btn-icon" onClick={onNewFolder} title="New Root Folder" aria-label="Create New Root Folder">
          <FolderPlus size={14} aria-hidden="true" />
        </button>
      </div>

      <div
        role="tree"
        aria-label="Folder Navigation Tree"
        className="folder-tree-root"
        style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}
      >
        {rootFolders.map(folder => (
          <FolderNode
            key={folder.id}
            folder={folder}
            allFolders={folders}
            selectedFolder={selectedFolder}
            onSelectFolder={onSelectFolder}
            onNewSubFolder={onNewSubFolder}
            onRenameFolder={onRenameFolder}
            onDeleteFolder={onDeleteFolder}
            expandedIds={expandedIds}
            onToggleExpand={handleToggleExpand}
            depth={0}
          />
        ))}
      </div>
    </div>
  );
};
