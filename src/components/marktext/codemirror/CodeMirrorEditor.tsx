import React, { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { SlashMenu, SlashMenuItem } from '../SlashMenu';
import { FloatingToolbar } from '../FloatingToolbar';
import { 
  Heading1, Heading2, Heading3, Table, Code, Sigma, 
  ListChecks, MessageSquareQuote, Minus 
} from 'lucide-react';

interface CodeMirrorEditorProps {
  content: string;
  onChange: (newContent: string) => void;
  placeholder?: string;
  fontSize?: number;
  fontFamily?: string;
}

export const CodeMirrorEditor: React.FC<CodeMirrorEditorProps> = ({
  content,
  onChange,
  placeholder = 'Type / for commands...',
  fontSize = 16,
  fontFamily = 'var(--font-sans)'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  // Slash Menu State
  const [slashOpen, setSlashOpen] = React.useState(false);
  const [slashPos, setSlashPos] = React.useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [slashSearch, setSlashSearch] = React.useState('');
  const [slashIndex, setSlashIndex] = React.useState(0);

  // Floating Toolbar State
  const [floatingOpen, setFloatingOpen] = React.useState(false);
  const [floatingPos, setFloatingPos] = React.useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const startState = EditorState.create({
      doc: content,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        markdown({ base: markdownLanguage }),
        oneDark,
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          indentWithTab
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newDoc = update.state.doc.toString();
            onChange(newDoc);
          }

          // Handle Selection & Slash menu detection
          const view = update.view;
          const { from, to } = view.state.selection.main;
          if (from !== to) {
            const coords = view.coordsAtPos(from);
            if (coords) {
              setFloatingPos({ top: Math.max(60, coords.top - 40), left: coords.left });
              setFloatingOpen(true);
            }
          } else {
            setFloatingOpen(false);
          }

          const line = view.state.doc.lineAt(from);
          if (line.text.trim().startsWith('/')) {
            const search = line.text.trim().slice(1);
            setSlashSearch(search);
            const coords = view.coordsAtPos(from);
            if (coords) {
              setSlashPos({ top: coords.bottom + 5, left: coords.left });
              setSlashOpen(true);
            }
          } else {
            setSlashOpen(false);
          }
        }),
        EditorView.theme({
          '&': {
            height: '100%',
            minHeight: '450px',
            fontSize: `${fontSize}px`,
            fontFamily: fontFamily,
            backgroundColor: 'transparent'
          },
          '.cm-scroller': { overflow: 'auto', fontFamily: fontFamily },
          '.cm-content': { padding: '20px 24px' },
          '.cm-line': { lineHeight: '1.7' }
        })
      ]
    });

    const view = new EditorView({
      state: startState,
      parent: containerRef.current
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, []);

  // Sync external content changes if note switches
  useEffect(() => {
    if (viewRef.current) {
      const currentDoc = viewRef.current.state.doc.toString();
      if (currentDoc !== content) {
        viewRef.current.dispatch({
          changes: { from: 0, to: currentDoc.length, insert: content }
        });
      }
    }
  }, [content]);

  const insertTextAtCursor = (prefix: string, suffix: string = '') => {
    if (!viewRef.current) return;
    const view = viewRef.current;
    const { from, to } = view.state.selection.main;
    const selected = view.state.sliceDoc(from, to);
    const replacement = prefix + selected + suffix;
    view.dispatch({
      changes: { from, to, insert: replacement },
      selection: { anchor: from + prefix.length + selected.length + suffix.length }
    });
    view.focus();
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

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }} />

      <FloatingToolbar
        isOpen={floatingOpen}
        position={floatingPos}
        onFormat={insertTextAtCursor}
        onClose={() => setFloatingOpen(false)}
      />

      <SlashMenu
        isOpen={slashOpen}
        onClose={() => setSlashOpen(false)}
        position={slashPos}
        searchQuery={slashSearch}
        onSelectItem={(item) => {
          item.action();
          setSlashOpen(false);
        }}
        items={filteredSlashItems}
        selectedIndex={slashIndex}
      />
    </div>
  );
};
