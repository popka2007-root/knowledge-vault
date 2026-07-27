import React, { useState } from 'react';
import { Lock, Unlock, Key, X, ShieldAlert } from 'lucide-react';
import { Note } from '../types';
import { encryptNoteContent, decryptNoteContent } from '../utils/crypto';
import { Language, t } from '../utils/i18n';

interface VaultModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedNote: Note) => void;
  lang: Language;
}

export const VaultModal: React.FC<VaultModalProps> = ({
  note,
  isOpen,
  onClose,
  onSuccess,
  lang
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !note) return null;

  const isLocking = !note.isEncrypted;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError('Password cannot be empty');
      return;
    }

    try {
      if (isLocking) {
        // Lock & Encrypt with AES-256
        const encrypted = encryptNoteContent(note.content, password);
        onSuccess({
          ...note,
          isEncrypted: true,
          encryptedData: encrypted,
          content: '🔒 Encrypted Content in Vault'
        });
      } else {
        // Unlock & Decrypt AES-256
        if (!note.encryptedData) {
          throw new Error('No encrypted data found.');
        }
        const decrypted = decryptNoteContent(note.encryptedData, password);
        onSuccess({
          ...note,
          isEncrypted: false,
          content: decrypted,
          encryptedData: undefined
        });
      }
      setPassword('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Decryption failed. Invalid password.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--vault-purple)' }}>
            <Lock size={20} />
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
              {isLocking ? t('lockVault', lang) : t('encryptedVault', lang)}
            </h3>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.4 }}>
          {isLocking
            ? t('encryptNoteDesc', lang)
            : t('decryptNoteDesc', lang)}
        </p>

        {error && (
          <div style={{ padding: '8px 12px', background: 'rgba(248, 81, 73, 0.15)', border: '1px solid rgba(248, 81, 73, 0.3)', borderRadius: '6px', fontSize: '12px', color: 'var(--danger)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              {t('enterMasterPassword', lang)}
            </label>
            <div style={{ position: 'relative' }}>
              <Key size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                className="input"
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '32px' }}
                autoFocus
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="btn" onClick={onClose}>
              {t('cancel', lang)}
            </button>
            <button type="submit" className="btn btn-primary" style={{ background: 'var(--vault-purple)', borderColor: 'var(--vault-purple)' }}>
              {isLocking ? <Lock size={14} /> : <Unlock size={14} />}
              <span>{isLocking ? t('lock', lang) : t('unlock', lang)}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
