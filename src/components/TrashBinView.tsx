import React from 'react';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { Note } from '../types';
import { t, Language } from '../utils/i18n';

interface TrashBinViewProps {
  notes: Note[];
  onRestoreNote: (id: string) => void;
  onPermanentDeleteNote: (id: string) => void;
  onEmptyTrash: () => void;
  lang: Language;
}

export const TrashBinView: React.FC<TrashBinViewProps> = ({
  notes,
  onRestoreNote,
  onPermanentDeleteNote,
  onEmptyTrash,
  lang
}) => {
  const deletedNotes = notes.filter(n => n.isDeleted);

  return (
    <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trash2 size={22} style={{ color: 'var(--danger)' }} />
            <span>{t('trashBinTitle', lang)}</span>
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {t('trashBinDesc', lang)}
          </p>
        </div>

        {deletedNotes.length > 0 && (
          <button className="btn" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={onEmptyTrash}>
            <Trash2 size={14} />
            <span>{t('emptyTrashBtn', lang)}</span>
          </button>
        )}
      </div>

      {deletedNotes.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--text-muted)' }}>
          <Trash2 size={48} style={{ marginBottom: '16px', opacity: 0.4 }} />
          <p style={{ fontSize: '15px', fontWeight: '500' }}>{t('trashEmptyStateTitle', lang)}</p>
          <p style={{ fontSize: '12px', marginTop: '4px' }}>{t('trashEmptyStateDesc', lang)}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {deletedNotes.map(note => (
            <div key={note.id} className="glass-panel" style={{ padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>{note.title || t('untitled', lang)}</h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {note.deletedAt ? new Date(note.deletedAt).toLocaleDateString() : ''}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {note.content.replace(/[#*`_]/g, '') || 'No text content'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <button className="btn btn-primary" style={{ flex: 1, padding: '6px 10px', fontSize: '12px' }} onClick={() => onRestoreNote(note.id)}>
                  <RotateCcw size={13} />
                  <span>{t('restore', lang)}</span>
                </button>
                <button className="btn" style={{ padding: '6px 10px', fontSize: '12px', color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => onPermanentDeleteNote(note.id)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
