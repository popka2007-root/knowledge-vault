import React, { useEffect, useRef } from 'react';
import { 
  Heading1, Heading2, Heading3, Table, Code, Sigma, 
  ListChecks, MessageSquareQuote, Minus, Image, FileText 
} from 'lucide-react';

export interface SlashMenuItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  action: () => void;
}

interface SlashMenuProps {
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number };
  searchQuery: string;
  onSelectItem: (item: SlashMenuItem) => void;
  items: SlashMenuItem[];
  selectedIndex: number;
}

export const SlashMenu: React.FC<SlashMenuProps> = ({
  isOpen,
  onClose,
  position,
  searchQuery,
  onSelectItem,
  items,
  selectedIndex
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('mousedown', handleClickOutside);
    }
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen || items.length === 0) return null;

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 9999,
        width: '280px',
        maxHeight: '320px',
        overflowY: 'auto',
        background: 'var(--bg-secondary)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
        padding: '6px'
      }}
    >
      <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', padding: '4px 8px', textTransform: 'uppercase' }}>
        MarkText Commands
      </div>
      {items.map((item, idx) => (
        <div
          key={item.id}
          onClick={item.action}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 10px',
            borderRadius: '6px',
            cursor: 'pointer',
            background: idx === selectedIndex ? 'var(--bg-hover)' : 'transparent',
            border: idx === selectedIndex ? '1px solid var(--border-focus)' : '1px solid transparent'
          }}
        >
          <div style={{ color: 'var(--accent-primary)', display: 'flex' }}>
            {item.icon}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.subtitle}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
