import React, { useEffect, useRef } from 'react';
import { Bold, Italic, Underline, Code, Link, Highlighter, Strikethrough } from 'lucide-react';

interface FloatingToolbarProps {
  isOpen: boolean;
  position: { top: number; left: number };
  onFormat: (prefix: string, suffix?: string) => void;
  onClose: () => void;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  isOpen,
  position,
  onFormat,
  onClose
}) => {
  const toolbarRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  return (
    <div
      ref={toolbarRef}
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translate(-50%, -100%)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        padding: '4px 6px',
        background: '#181c24',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(12px)'
      }}
    >
      <button className="btn-icon" onClick={() => onFormat('**', '**')} title="Bold">
        <Bold size={14} />
      </button>
      <button className="btn-icon" onClick={() => onFormat('*', '*')} title="Italic">
        <Italic size={14} />
      </button>
      <button className="btn-icon" onClick={() => onFormat('<u>', '</u>')} title="Underline">
        <Underline size={14} />
      </button>
      <button className="btn-icon" onClick={() => onFormat('~~', '~~')} title="Strikethrough">
        <Strikethrough size={14} />
      </button>
      <button className="btn-icon" onClick={() => onFormat('`', '`')} title="Inline Code">
        <Code size={14} />
      </button>
      <button className="btn-icon" onClick={() => onFormat('<mark>', '</mark>')} title="Highlight">
        <Highlighter size={14} />
      </button>
      <button className="btn-icon" onClick={() => onFormat('[[', ']]')} title="WikiLink">
        <Link size={14} color="#388bfd" />
      </button>
    </div>
  );
};
