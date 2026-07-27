import React from 'react';
import { History, RotateCcw, X, Clock } from 'lucide-react';
import { Note, NoteSnapshot } from '../types';
import { Language, t } from '../utils/i18n';

interface VersionHistoryModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onRestoreSnapshot: (snapshot: NoteSnapshot) => void;
  lang: Language;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  note,
  isOpen,
  onClose,
  onRestoreSnapshot,
  lang
}) => {
  if (!isOpen || !note) return null;

  const snapshots = note.history || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ width: '640px', maxWidth: '95vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={20} style={{ color: 'var(--accent-hover)' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
              {t('noteVersionHistoryTitle', lang)}
            </h3>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          {t('reviewingSnapshotsFor', lang)} "{note.title}"
        </p>

        {/* Snapshots List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
          {snapshots.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              <Clock size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
              <p>{t('noSnapshotsAvailable', lang)}</p>
            </div>
          ) : (
            snapshots.map((snap) => (
              <div key={snap.id} className="glass-panel" style={{ padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent-hover)' }}>
                    {new Date(snap.timestamp).toLocaleString()}
                  </span>
                  <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => onRestoreSnapshot(snap)}>
                    <RotateCcw size={12} />
                    <span>{t('restoreVersion', lang)}</span>
                  </button>
                </div>

                <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '6px', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap', maxHeight: '120px', overflowY: 'auto' }}>
                  {snap.content}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
