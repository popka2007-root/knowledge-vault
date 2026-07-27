import React from 'react';
import { List, Hash, ChevronRight } from 'lucide-react';
import { Language, t } from '../utils/i18n';

interface HeadingItem {
  level: number;
  text: string;
  lineIndex: number;
}

interface DocumentOutlineProps {
  content: string;
  lang: Language;
  onScrollToLine?: (lineIndex: number) => void;
}

export const DocumentOutline: React.FC<DocumentOutlineProps> = ({ content, lang, onScrollToLine }) => {
  const lines = content.split('\n');
  const headings: HeadingItem[] = [];

  lines.forEach((line, index) => {
    const match = line.match(/^(#{1,6})\s+(.*)$/);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
        lineIndex: index
      });
    }
  });

  return (
    <div style={{
      width: '220px',
      background: 'var(--bg-secondary)',
      borderLeft: '1px solid var(--border-color)',
      padding: '16px 12px',
      height: '100%',
      overflowY: 'auto'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        <List size={14} />
        <span>{t('outline', lang)}</span>
      </div>

      {headings.length === 0 ? (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '12px 4px' }}>
          No headings found in note. Use # Heading to build outline.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {headings.map((h, i) => (
            <div
              key={i}
              onClick={() => onScrollToLine && onScrollToLine(h.lineIndex)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                paddingLeft: `${(h.level - 1) * 12 + 8}px`,
                fontSize: '12.5px',
                borderRadius: '4px',
                color: h.level === 1 ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: h.level === 1 ? '600' : '400',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
              className="outline-item"
            >
              <Hash size={12} style={{ opacity: 0.5, flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
