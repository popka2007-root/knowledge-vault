import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: string;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose, lang = 'ru' }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + P / Cmd + K', desc: lang === 'ru' ? 'Открыть Командную Палитру' : 'Open Command Palette' },
    { key: 'Ctrl + B', desc: lang === 'ru' ? 'Полужирный текст' : 'Bold Text' },
    { key: 'Ctrl + I', desc: lang === 'ru' ? 'Курсив' : 'Italic Text' },
    { key: 'Ctrl + U', desc: lang === 'ru' ? 'Подчёркнутый текст' : 'Underline Text' },
    { key: 'Ctrl + Z', desc: lang === 'ru' ? 'Отменить действие' : 'Undo Action' },
    { key: 'F11', desc: lang === 'ru' ? 'Режим концентрации Zen Mode' : 'Zen Focus Mode' },
    { key: '?', desc: lang === 'ru' ? 'Открыть эту справку' : 'Open Shortcuts Cheat Sheet' }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        width: '460px',
        maxWidth: '90vw',
        padding: '20px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.4)'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Keyboard size={18} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {lang === 'ru' ? 'Горячие клавиши' : 'Keyboard Shortcuts'}
            </h3>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {shortcuts.map(s => (
            <div key={s.key} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: 'var(--bg-tertiary)',
              borderRadius: '6px',
              border: '1px solid var(--border-color)'
            }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{s.desc}</span>
              <kbd style={{
                fontSize: '11px',
                fontWeight: 600,
                fontFamily: 'var(--font-mono)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid var(--border-color)'
              }}>{s.key}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
