import React, { useState } from 'react';
import { FolderPlus, ChevronRight, ChevronDown, Folder as FolderIcon } from 'lucide-react';
import { Folder } from '../types';
import { Language, t } from '../utils/i18n';

export interface FolderTreeProps {
  folders: Folder[];
  selectedFolder: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onNewFolder: () => void;
  lang: Language;
}

interface FolderNodeProps {
  folder: Folder;
  allFolders: Folder[];
  selectedFolder: string | null;
  onSelectFolder: (folderId: string | null) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  depth: number;
}

const FolderNode: React.FC<FolderNodeProps> = ({
  folder,
  allFolders,
  selectedFolder,
  onSelectFolder,
  expandedIds,
  onToggleExpand,
  depth
}) => {
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
          padding: '4px 8px',
          paddingLeft: `${Math.max(8, depth * 14)}px`,
          borderRadius: '6px',
          fontSize: depth > 0 ? '11px' : '12px',
          color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
          background: isSelected ? 'var(--bg-hover)' : 'transparent',
          cursor: 'pointer',
          userSelect: 'none',
          outline: 'none',
          transition: 'background 0.15s ease'
        }}
        onClick={() => onSelectFolder(folder.id)}
        onKeyDown={handleKeyDown}
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
        <button className="btn-icon" onClick={onNewFolder} title="New Folder" aria-label="Create New Folder">
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
            expandedIds={expandedIds}
            onToggleExpand={handleToggleExpand}
            depth={0}
          />
        ))}
      </div>
    </div>
  );
};
