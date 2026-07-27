import React from 'react';
import { Link, Share2, Sparkles, ChevronRight } from 'lucide-react';
import { Note, BacklinkItem } from '../../types';
import { extractWikiLinks } from '../../utils/crypto';

interface BacklinksPanelProps {
  currentNote: Note;
  allNotes: Note[];
  onSelectNote: (id: string) => void;
}

export const BacklinksPanel: React.FC<BacklinksPanelProps> = ({
  currentNote,
  allNotes,
  onSelectNote
}) => {
  // Calculate Backlinks (notes that contain [[currentNote.title]])
  const backlinks: BacklinkItem[] = [];
  const currentTitleLower = currentNote.title.toLowerCase().trim();

  allNotes.forEach(note => {
    if (note.id === currentNote.id) return;
    const wikiLinks = extractWikiLinks(note.content);
    if (wikiLinks.some(link => link.toLowerCase().trim() === currentTitleLower)) {
      backlinks.push({
        sourceNoteId: note.id,
        sourceNoteTitle: note.title || 'Untitled',
        snippet: note.content.slice(0, 100)
      });
    }
  });

  // Calculate Recommended Notes (based on shared tags)
  const recommendedNotes = allNotes.filter(note => {
    if (note.id === currentNote.id) return false;
    return note.tags.some(t => currentNote.tags.includes(t));
  }).slice(0, 3);

  return (
    <div style={{ padding: '16px 20px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', marginTop: '24px', borderRadius: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>
        <Link size={15} color="var(--accent-hover)" />
        <span>Backlinks ({backlinks.length})</span>
      </div>

      {backlinks.length === 0 ? (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          No backlinks found. Use [[{currentNote.title || 'Note Title'}]] in other notes to link here.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
          {backlinks.map(b => (
            <div
              key={b.sourceNoteId}
              onClick={() => onSelectNote(b.sourceNoteId)}
              style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-tertiary)', cursor: 'pointer', fontSize: '12.5px' }}
            >
              <div style={{ fontWeight: '600', color: 'var(--accent-hover)', marginBottom: '2px' }}>{b.sourceNoteTitle}</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{b.snippet}...</div>
            </div>
          ))}
        </div>
      )}

      {/* Recommended Notes */}
      {recommendedNotes.length > 0 && (
        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: 'var(--vault-purple)', marginBottom: '8px' }}>
            <Sparkles size={14} />
            <span>Recommended Related Notes</span>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {recommendedNotes.map(n => (
              <span
                key={n.id}
                onClick={() => onSelectNote(n.id)}
                className="tag-badge"
                style={{ cursor: 'pointer', fontSize: '11px' }}
              >
                {n.title}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
