import React from 'react';
import { Search, Plus, Star, Lock, FileText, LayoutGrid, Tag, Folder } from 'lucide-react';
import { Note } from '../types';
import { Language, t } from '../utils/i18n';

interface NoteListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  onNewNote: () => void;
  onNewCanvas: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedFolder: string | null;
  selectedTag: string | null;
  showFavoritesOnly: boolean;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  lang: Language;
}

export const NoteList: React.FC<NoteListProps> = ({
  notes,
  selectedNoteId,
  onSelectNote,
  onNewNote,
  onNewCanvas,
  searchQuery,
  setSearchQuery,
  selectedFolder,
  selectedTag,
  showFavoritesOnly,
  onToggleFavorite,
  lang
}) => {
  return (
    <div className="glass-panel" style={{ width: 'var(--notelist-width)', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search Header */}
      <div style={{ padding: '16px 12px 12px 12px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input"
            placeholder={t('searchPlaceholder', lang)}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '32px' }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={onNewNote}>
            <Plus size={16} />
            <span>{t('newNote', lang)}</span>
          </button>
          <button className="btn" style={{ justifyContent: 'center' }} onClick={onNewCanvas} title={t('newCanvas', lang)}>
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {/* Filter Status Badge if Active */}
      {(selectedFolder || selectedTag || showFavoritesOnly || searchQuery) && (
        <div style={{ padding: '8px 12px', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
          <span>{t('filteringBy', lang)}</span>
          {showFavoritesOnly && <span className="tag-badge" style={{ color: '#e3b341', borderColor: '#e3b341' }}>{t('favorites', lang)}</span>}
          {selectedFolder && <span className="tag-badge" style={{ color: 'var(--accent-hover)' }}>Folder</span>}
          {selectedTag && <span className="tag-badge">#{selectedTag}</span>}
          {searchQuery && <span className="tag-badge" style={{ color: 'var(--text-primary)' }}>"{searchQuery}"</span>}
        </div>
      )}

      {/* Note Items List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {notes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
            <FileText size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
            <p style={{ fontSize: '13px', fontWeight: '500' }}>{t('noNotes', lang)}</p>
            <p style={{ fontSize: '11px', marginTop: '4px' }}>{t('clickNewNote', lang)}</p>
          </div>
        ) : (
          notes.map((note) => {
            const isSelected = note.id === selectedNoteId;
            const snippet = note.isEncrypted
              ? '🔒 Encrypted Vault Content'
              : note.content.replace(/#+\s/g, '').slice(0, 90) || 'Empty note';

            const formattedDate = new Date(note.updatedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric'
            });

            return (
              <div
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                tabIndex={0}
                role="button"
                aria-label={`Select note: ${note.title || 'Untitled Note'}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectNote(note.id);
                  }
                }}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '6px',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--bg-hover)' : 'var(--bg-secondary)',
                  border: isSelected ? '1px solid var(--border-focus)' : '1px solid transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                    {note.isEncrypted ? (
                      <Lock size={14} color="var(--vault-purple)" style={{ flexShrink: 0 }} />
                    ) : (
                      <FileText size={14} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                    )}
                    <h3 style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {note.title || 'Untitled Note'}
                    </h3>
                  </div>

                  <button
                    className="btn-icon"
                    onClick={(e) => onToggleFavorite(note.id, e)}
                    style={{ padding: '2px' }}
                    title={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star size={14} fill={note.isFavorite ? '#e3b341' : 'transparent'} color={note.isFavorite ? '#e3b341' : 'var(--text-muted)'} />
                  </button>
                </div>

                {/* Content Snippet */}
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, height: '34px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginBottom: '8px' }}>
                  {snippet}
                </p>

                {/* Footer Metadata */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-muted)' }}>
                  <span>{formattedDate}</span>
                  {note.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {note.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="tag-badge" style={{ fontSize: '10px', padding: '1px 5px' }}>
                          #{tag}
                        </span>
                      ))}
                      {note.tags.length > 2 && <span>+{note.tags.length - 2}</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
