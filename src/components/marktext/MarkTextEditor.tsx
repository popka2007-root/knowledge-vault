import React, { useState, useRef, useEffect } from 'react';
import { SlashMenu, SlashMenuItem } from './SlashMenu';
import { FloatingToolbar } from './FloatingToolbar';
import { TableEditor } from './TableEditor';
import { 
  Heading1, Heading2, Heading3, Table, Code, Sigma, 
  ListChecks, MessageSquareQuote, Minus, Image 
} from 'lucide-react';

interface MarkTextEditorProps {
  content: string;
  onChange: (newContent: string) => void;
  placeholder?: string;
  fontSize?: number;
  fontFamily?: string;
}

export const MarkTextEditor: React.FC<MarkTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Type / for commands or start writing...',
  fontSize = 16,
  fontFamily = 'var(--font-sans)'
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [activeLineIndex, setActiveLineIndex] = useState<number>(0);
  const [cursorPos, setCursorPos] = useState<number>(0);

  // Slash Menu State
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashPos, setSlashPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [slashSearch, setSlashSearch] = useState('');
  const [slashIndex, setSlashIndex] = useState(0);

  // Floating Toolbar State
  const [floatingOpen, setFloatingOpen] = useState(false);
  const [floatingPos, setFloatingPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const lines = content.split('\n');

  // Track cursor and selection
  const handleSelectionChange = () => {
    if (!textareaRef.current) return;
    const { selectionStart, selectionEnd, value } = textareaRef.current;
    setCursorPos(selectionStart);

    // Calculate line index
    const textBefore = value.slice(0, selectionStart);
    const lineIdx = textBefore.split('\n').length - 1;
    setActiveLineIndex(lineIdx);

    // Floating text selection toolbar
    if (selectionStart !== selectionEnd) {
      const rect = textareaRef.current.getBoundingClientRect();
      setFloatingPos({
        top: Math.max(80, rect.top + 40),
        left: rect.left + rect.width / 2
      });
      setFloatingOpen(true);
    } else {
      setFloatingOpen(false);
    }

    // Slash menu trigger (/ at start of line or after space)
    const currentLineText = value.split('\n')[lineIdx] || '';
    if (currentLineText.trim().startsWith('/')) {
      const search = currentLineText.trim().slice(1);
      setSlashSearch(search);
      const rect = textareaRef.current.getBoundingClientRect();
      setSlashPos({
        top: Math.min(window.innerHeight - 300, rect.top + (lineIdx * 24) + 60),
        left: rect.left + 40
      });
      setSlashOpen(true);
    } else {
      setSlashOpen(false);
    }
  };

  const insertTextAtCursor = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = prefix + selected + suffix;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    onChange(newContent);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + prefix.length, end + prefix.length);
      }
    }, 0);
  };

  const handleSlashSelect = (item: SlashMenuItem) => {
    item.action();
    setSlashOpen(false);
  };

  const slashCommands: SlashMenuItem[] = [
    {
      id: 'h1',
      title: 'Heading 1',
      subtitle: 'Large section heading',
      icon: <Heading1 size={16} />,
      action: () => insertTextAtCursor('# ')
    },
    {
      id: 'h2',
      title: 'Heading 2',
      subtitle: 'Medium section heading',
      icon: <Heading2 size={16} />,
      action: () => insertTextAtCursor('## ')
    },
    {
      id: 'h3',
      title: 'Heading 3',
      subtitle: 'Small section heading',
      icon: <Heading3 size={16} />,
      action: () => insertTextAtCursor('### ')
    },
    {
      id: 'table',
      title: 'Table',
      subtitle: 'Insert GFM markdown table',
      icon: <Table size={16} />,
      action: () => insertTextAtCursor('\n| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |\n')
    },
    {
      id: 'code',
      title: 'Code Block',
      subtitle: 'Syntax highlighted code block',
      icon: <Code size={16} />,
      action: () => insertTextAtCursor('```js\n// Write code here\n```\n')
    },
    {
      id: 'math',
      title: 'Math Formula',
      subtitle: 'LaTeX / KaTeX equation block',
      icon: <Sigma size={16} />,
      action: () => insertTextAtCursor('$$\nE = mc^2\n$$\n')
    },
    {
      id: 'task',
      title: 'Task List',
      subtitle: 'Interactive task checklist',
      icon: <ListChecks size={16} />,
      action: () => insertTextAtCursor('- [ ] ')
    },
    {
      id: 'quote',
      title: 'Quote Block',
      subtitle: 'Blockquote or Callout',
      icon: <MessageSquareQuote size={16} />,
      action: () => insertTextAtCursor('> [!NOTE]\n> ')
    },
    {
      id: 'divider',
      title: 'Divider',
      subtitle: 'Horizontal divider line',
      icon: <Minus size={16} />,
      action: () => insertTextAtCursor('\n---\n')
    }
  ];

  const filteredSlashItems = slashCommands.filter(c => 
    c.title.toLowerCase().includes(slashSearch.toLowerCase()) || 
    c.id.includes(slashSearch.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (slashOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashIndex(prev => (prev + 1) % filteredSlashItems.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashIndex(prev => (prev - 1 + filteredSlashItems.length) % filteredSlashItems.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredSlashItems[slashIndex]) {
          handleSlashSelect(filteredSlashItems[slashIndex]);
        }
        return;
      }
      if (e.key === 'Escape') {
        setSlashOpen(false);
        return;
      }
    }

    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') { e.preventDefault(); insertTextAtCursor('**', '**'); }
      else if (e.key === 'i') { e.preventDefault(); insertTextAtCursor('*', '*'); }
      else if (e.key === 'u') { e.preventDefault(); insertTextAtCursor('<u>', '</u>'); }
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <textarea
        ref={textareaRef}
        className="marktext-editor-textarea"
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onSelect={handleSelectionChange}
        onClick={handleSelectionChange}
        onKeyUp={handleSelectionChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '450px',
          padding: '20px 24px',
          fontSize: `${fontSize}px`,
          fontFamily: fontFamily,
          lineHeight: '1.7',
          background: 'transparent',
          color: 'var(--text-primary)',
          border: 'none',
          outline: 'none',
          resize: 'none'
        }}
      />

      {/* Floating Selection Formatting Toolbar */}
      <FloatingToolbar
        isOpen={floatingOpen}
        position={floatingPos}
        onFormat={insertTextAtCursor}
        onClose={() => setFloatingOpen(false)}
      />

      {/* Slash Command Palette Menu */}
      <SlashMenu
        isOpen={slashOpen}
        onClose={() => setSlashOpen(false)}
        position={slashPos}
        searchQuery={slashSearch}
        onSelectItem={handleSlashSelect}
        items={filteredSlashItems}
        selectedIndex={slashIndex}
      />
    </div>
  );
};
