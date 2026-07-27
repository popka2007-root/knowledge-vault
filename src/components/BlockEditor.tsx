import React, { useState, useEffect, KeyboardEvent } from 'react';
import { Note, Block } from '../types';

interface BlockEditorProps {
  note: Note;
  onChange: (updatedContent: string, newBlocks: Block[]) => void;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({ note, onChange }) => {
  const [blocks, setBlocks] = useState<Block[]>(note.blocks || []);

  // Simple markdown to blocks parser if note.blocks is empty
  useEffect(() => {
    if (!note.blocks || note.blocks.length === 0) {
      const parseMarkdown = (md: string): Block[] => {
        const lines = md.split('\n');
        return lines.map((line, i) => {
          const id = `block-${Date.now()}-${i}`;
          if (line.startsWith('# ')) return { id, type: 'heading', properties: { level: 1 }, content: line.substring(2) };
          if (line.startsWith('## ')) return { id, type: 'heading', properties: { level: 2 }, content: line.substring(3) };
          if (line.startsWith('### ')) return { id, type: 'heading', properties: { level: 3 }, content: line.substring(4) };
          if (line.startsWith('- [ ] ')) return { id, type: 'task', properties: { checked: false }, content: line.substring(6) };
          if (line.startsWith('- [x] ')) return { id, type: 'task', properties: { checked: true }, content: line.substring(6) };
          if (line.startsWith('- ')) return { id, type: 'list-item', content: line.substring(2) };
          if (line.startsWith('> ')) return { id, type: 'quote', content: line.substring(2) };
          return { id, type: 'paragraph', content: line };
        });
      };
      setBlocks(parseMarkdown(note.content));
    }
  }, [note.id]);

  const updateBlock = (id: string, newContent: string) => {
    const newBlocks = blocks.map(b => b.id === id ? { ...b, content: newContent } : b);
    setBlocks(newBlocks);
    serializeAndSave(newBlocks);
  };

  const toggleTask = (id: string) => {
    const newBlocks = blocks.map(b => 
      b.id === id ? { ...b, properties: { ...b.properties, checked: !b.properties?.checked } } : b
    );
    setBlocks(newBlocks);
    serializeAndSave(newBlocks);
  };

  const serializeAndSave = (currentBlocks: Block[]) => {
    const md = currentBlocks.map(b => {
      switch (b.type) {
        case 'heading': return `${'#'.repeat(b.properties?.level || 1)} ${b.content}`;
        case 'task': return `- [${b.properties?.checked ? 'x' : ' '}] ${b.content}`;
        case 'list-item': return `- ${b.content}`;
        case 'quote': return `> ${b.content}`;
        default: return b.content;
      }
    }).join('\n');
    onChange(md, currentBlocks);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>, index: number) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const newBlock: Block = { id: `block-${Date.now()}`, type: 'paragraph', content: '' };
      const newBlocks = [
        ...blocks.slice(0, index + 1),
        newBlock,
        ...blocks.slice(index + 1)
      ];
      setBlocks(newBlocks);
      serializeAndSave(newBlocks);
      
      setTimeout(() => {
        const nextEl = document.getElementById(`textarea-${newBlock.id}`);
        if (nextEl) nextEl.focus();
      }, 0);
    } else if (e.key === 'Backspace' && blocks[index].content === '') {
      e.preventDefault();
      if (blocks.length > 1) {
        const prevId = blocks[index - 1]?.id;
        const newBlocks = blocks.filter((_, i) => i !== index);
        setBlocks(newBlocks);
        serializeAndSave(newBlocks);
        
        if (prevId) {
          setTimeout(() => {
            const prevEl = document.getElementById(`textarea-${prevId}`) as HTMLTextAreaElement;
            if (prevEl) {
              prevEl.focus();
              prevEl.selectionStart = prevEl.value.length;
              prevEl.selectionEnd = prevEl.value.length;
            }
          }, 0);
        }
      }
    }
  };

  return (
    <div className="block-editor" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', paddingBottom: '50vh' }}>
      {blocks.map((block, index) => {
        const isHeading = block.type === 'heading';
        const level = block.properties?.level || 1;
        
        return (
          <div key={block.id} className="block-row" style={{ display: 'flex', alignItems: 'flex-start', margin: '4px 0', gap: '8px', position: 'relative' }}>
            <div style={{ opacity: 0.2, cursor: 'grab', marginTop: '6px', userSelect: 'none' }}>
              ⋮⋮
            </div>

            {block.type === 'task' && (
              <input 
                type="checkbox" 
                checked={!!block.properties?.checked} 
                onChange={() => toggleTask(block.id)}
                style={{ marginTop: '8px', cursor: 'pointer' }}
              />
            )}
            {block.type === 'list-item' && <span style={{ marginTop: '4px', color: 'var(--text-muted)' }}>•</span>}
            
            <textarea
              id={`textarea-${block.id}`}
              value={block.content}
              onChange={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
                updateBlock(block.id, e.target.value);
              }}
              onKeyDown={(e) => handleKeyDown(e, index)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                overflow: 'hidden',
                fontFamily: 'inherit',
                color: 'var(--text-primary)',
                fontSize: isHeading ? (level === 1 ? '28px' : level === 2 ? '24px' : '20px') : '16px',
                fontWeight: isHeading ? 'bold' : 'normal',
                borderLeft: block.type === 'quote' ? '3px solid var(--border-color)' : 'none',
                paddingLeft: block.type === 'quote' ? '12px' : '0',
                fontStyle: block.type === 'quote' ? 'italic' : 'normal',
                padding: '4px 0',
                minHeight: '28px',
                textDecoration: (block.type === 'task' && block.properties?.checked) ? 'line-through' : 'none',
                opacity: (block.type === 'task' && block.properties?.checked) ? 0.6 : 1
              }}
              rows={1}
              ref={(el) => {
                if (el) {
                  el.style.height = 'auto';
                  el.style.height = el.scrollHeight + 'px';
                }
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
