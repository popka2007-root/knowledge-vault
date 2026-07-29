import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  Unlock, 
  Trash2, 
  Eye, 
  Edit3, 
  CheckCircle2,
  Folder,
  Tag as TagIcon
} from 'lucide-react';
import { Note, Folder as FolderType } from '../types';
import { extractTags } from '../utils/crypto';
import { Language, t } from '../utils/i18n';
import { EditorToolbar } from './EditorToolbar';
import { DocumentOutline } from './DocumentOutline';
import { AICopilotModal } from './AICopilotModal';
import { AudioRecorderModal } from './AudioRecorderModal';
import { exportNoteToPDF, exportNoteToHTML } from '../utils/export';
import { PageBanner } from '../modules/banners/PageBanner';
import { BacklinksPanel } from '../modules/links/BacklinksPanel';
import { executeDataviewQuery } from '../modules/dataview/queryEngine';
import { BlockEditor } from './BlockEditor';
import { ErrorBoundary } from './ErrorBoundary';
import { MarkTextEditor } from './marktext/MarkTextEditor';
import { CodeMirrorEditor } from './marktext/codemirror/CodeMirrorEditor';
import { TableEditor } from './marktext/TableEditor';
import { DataviewBuilderModal } from './DataviewBuilderModal';
import { extractMarkdownTables } from '../utils/editorUtils';

const escapeHtml = (str: string) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

interface EditorProps {
  note: Note | null;
  folders: FolderType[];
  onUpdateNote: (updatedNote: Note) => void;
  onDeleteNote: (id: string) => void;
  allNotes: Note[];
  onSelectNoteByTitle: (title: string) => void;
  onLockVaultNote: (note: Note) => void;
  onOpenHistory?: () => void;
  lang: Language;
}

export const Editor: React.FC<EditorProps> = ({
  note,
  folders,
  onUpdateNote,
  onDeleteNote,
  allNotes,
  onSelectNoteByTitle,
  onLockVaultNote,
  onOpenHistory,
  lang
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [folderId, setFolderId] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [showOutline, setShowOutline] = useState(false);
  const [useBlockEditor, setUseBlockEditor] = useState(!!note?.blocks?.length);
  const [showTableEditor, setShowTableEditor] = useState(false);

  // WikiLink Autocomplete Popup state
  const [wikiSearch, setWikiSearch] = useState<string | null>(null);
  
  // Modals
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [audioModalOpen, setAudioModalOpen] = useState(false);
  const [dataviewModalOpen, setDataviewModalOpen] = useState(false);

  // Toolbar styles
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('var(--font-sans)');
  const [paragraphType, setParagraphType] = useState('paragraph');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const currentNoteIdRef = useRef<string | null>(note?.id || null);
  const contentRef = useRef(content);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Clean up any pending auto-save timers on unmount or note switch
  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Cancel pending auto-save when target note changes
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    if (note) {
      currentNoteIdRef.current = note.id;
      setTitle(note.title || '');
      setContent(note.content || '');
      setFolderId(note.folder || '');
      setSaveStatus('saved');
      setUseBlockEditor(!!note.blocks?.length);
    } else {
      currentNoteIdRef.current = null;
    }
  }, [note?.id]);

  if (!note) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <Edit3 size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <h2>Select or Create a Note</h2>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>Choose a note from the left list to start writing</p>
        </div>
      </div>
    );
  }

  const handleContentChange = (newContent: string) => {
    const targetNoteId = note.id;
    setContent(newContent);
    setSaveStatus('saving');
    
    // Check WikiLink triggers [[
    const textarea = textareaRef.current;
    if (textarea) {
      const cursor = textarea.selectionStart;
      const beforeCursor = newContent.substring(0, cursor);
      const match = beforeCursor.match(/\[\[([^\]]*)$/);
      if (match) {
        setWikiSearch(match[1].toLowerCase());
      } else {
        setWikiSearch(null);
      }
    }

    const autoTags = extractTags(newContent).filter(t => !/^\s*#\s/.test(t));
    const combinedTags = Array.from(new Set([...(note.tags || []), ...autoTags]));

    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }

    timeoutIdRef.current = setTimeout(() => {
      // Prevent state desync: ensure the user hasn't switched notes during the delay
      if (currentNoteIdRef.current !== targetNoteId) {
        return;
      }

      const currentHistory = note.history || [];
      const lastSnap = currentHistory[currentHistory.length - 1];
      let newHistory = currentHistory;

      if (!lastSnap || Math.abs(lastSnap.content.length - newContent.length) > 10 || (Date.now() - lastSnap.timestamp > 60000 && lastSnap.content !== newContent)) {
        newHistory = [
          ...currentHistory,
          {
            id: `snap-${Date.now()}`,
            timestamp: Date.now(),
            title: title || note.title,
            content: newContent
          }
        ].slice(-20);
      }

      onUpdateNote({
        ...note,
        title,
        content: newContent,
        folder: folderId,
        tags: combinedTags,
        updatedAt: Date.now(),
        history: newHistory
      });
      setSaveStatus('saved');
    }, 300);
  };

  const insertWikiLink = (selectedTitle: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const cursor = textarea.selectionStart;
      const beforeCursor = content.substring(0, cursor);
      const matchIndex = beforeCursor.lastIndexOf('[[');
      if (matchIndex !== -1) {
        const newText = content.substring(0, matchIndex) + `[[${selectedTitle}]]` + content.substring(cursor);
        handleContentChange(newText);
        setWikiSearch(null);
      }
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    onUpdateNote({
      ...note,
      title: newTitle,
      updatedAt: Date.now()
    });
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      const cleanTag = newTagInput.trim().replace(/^#/, '');
      const existingTags = note.tags || [];
      if (!existingTags.includes(cleanTag)) {
        const updatedTags = [...existingTags, cleanTag];
        onUpdateNote({
          ...note,
          tags: updatedTags,
          updatedAt: Date.now()
        });
      }
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const existingTags = note.tags || [];
    const updatedTags = existingTags.filter(t => t !== tagToRemove);
    onUpdateNote({
      ...note,
      tags: updatedTags,
      updatedAt: Date.now()
    });
  };

  // Base64 Image Attachment Handler
  const handleImageUpload = (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = e.target?.result;
        if (typeof base64Data === 'string') {
          const markdownImage = `\n![${file.name}](${base64Data})\n`;
          handleContentChange(contentRef.current + markdownImage);
        }
      };
      reader.onerror = (err) => {
        console.error('Failed to read attached file:', err);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error handling image upload:', err);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const insertText = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = content.substring(start, end) || 'text';
      const replacement = prefix + selected + suffix;
      const newContent = content.substring(0, start) + replacement + content.substring(end);
      handleContentChange(newContent);
    } else {
      handleContentChange(content + prefix + suffix);
    }
  };

  const renderMarkdown = (text: string) => {
    try {
      let rendered = (text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

      const placeholders: string[] = [];
      
      // Dataview Query Codeblocks ```dataview ... ```
      rendered = rendered.replace(/```dataview\n([\s\S]*?)```/g, (_, queryStr) => {
        const unescapedQuery = (queryStr || '')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'");
        
        const queryRes = executeDataviewQuery(unescapedQuery, allNotes, note.tasks || []);
        
        if (queryRes.type === 'list') {
          const listItemsHtml = queryRes.rows.map(r => `<li style="padding:4px 0;">${escapeHtml(String(r[0]))}</li>`).join('');
          placeholders.push(`<div style="margin:14px 0; border:1px solid var(--border-color); border-radius:8px; overflow:hidden;"><div style="background:var(--bg-secondary); padding:8px 12px; font-size:12px; font-weight:600; color:var(--accent-hover);">📊 Dataview List Result (${queryRes.totalCount} items)</div><ul style="margin:0; padding:12px 24px; font-size:13px; background:var(--bg-primary); list-style-type:disc;">${listItemsHtml}</ul></div>`);
        } else {
          const rowsHtml = queryRes.rows.map(r => `<tr>${r.map(c => `<td style="padding:6px 12px; border:1px solid var(--border-color);">${escapeHtml(String(c))}</td>`).join('')}</tr>`).join('');
          const headersHtml = queryRes.headers ? `<thead><tr style="background:var(--bg-tertiary);">${queryRes.headers.map(h => `<th style="padding:6px 12px; border:1px solid var(--border-color); text-align:left;">${escapeHtml(String(h))}</th>`).join('')}</tr></thead>` : '';
          placeholders.push(`<div style="margin:14px 0; border:1px solid var(--border-color); border-radius:8px; overflow:hidden;"><div style="background:var(--bg-secondary); padding:8px 12px; font-size:12px; font-weight:600; color:var(--accent-hover);">📊 Dataview Query Result (${queryRes.totalCount} items)</div><table style="width:100%; border-collapse:collapse; font-size:12.5px;">${headersHtml}<tbody>${rowsHtml}</tbody></table></div>`);
        }
        return `___BLOCK_${placeholders.length - 1}___`;
      });
      
      // Codeblocks ``` ... ```
      rendered = rendered.replace(/```([a-z]*)\n([\s\S]*?)```/g, (_, lang, code) => {
        placeholders.push(`<pre style="background:#090d13; padding:14px; border-radius:8px; font-family:var(--font-mono); font-size:13px; color:#e6edf3; overflow-x:auto; margin:14px 0; border:1px solid var(--border-color);"><code>${code}</code></pre>`);
        return `___BLOCK_${placeholders.length - 1}___`;
      });
      
      // LaTeX Math Block $$ ... $$
      rendered = rendered.replace(/\$\$\n?([\s\S]*?)\n?\$\$/g, (_, math) => {
        placeholders.push(`<div style="background:var(--bg-tertiary); padding:12px; border-radius:6px; font-family:var(--font-mono); color:var(--vault-purple); margin:12px 0; text-align:center; border:1px solid var(--border-color); font-size:16px;"><strong>${math}</strong></div>`);
        return `___BLOCK_${placeholders.length - 1}___`;
      });
      
      // Inline Math $ ... $
      rendered = rendered.replace(/\$(?!\s)([^$]+?)(?<!\s)\$/g, (_, math) => {
        placeholders.push(`<code style="background:rgba(163,113,247,0.2); color:var(--vault-purple); padding:2px 6px; border-radius:4px;">${math}</code>`);
        return `___BLOCK_${placeholders.length - 1}___`;
      });

      let taskIndex = 0;
      rendered = rendered
        // Task Lists (- [ ] or - [x])
        .replace(/^- \[([ x])\] (.*$)/gim, (_, checkedStr, text) => {
          const isChecked = checkedStr.toLowerCase() === 'x';
          const checkedAttr = isChecked ? 'checked' : '';
          const style = isChecked ? 'text-decoration:line-through; opacity:0.6;' : '';
          const idx = taskIndex++;
          return `<div style="display:flex; align-items:center; gap:8px; margin:4px 0; ${style}"><input type="checkbox" class="task-checkbox" data-task-index="${idx}" ${checkedAttr} style="accent-color:var(--accent-primary); cursor:pointer;" aria-label="Task item ${idx + 1}" /> <span>${text}</span></div>`;
        })
        // Markdown Tables
        .replace(/\|(.+)\|/g, (match) => {
          const cells = match.split('|').filter(c => c.trim() !== '');
          return `<tr style="border-bottom:1px solid var(--border-color);">${cells.map(c => `<td style="padding:6px 12px; border:1px solid var(--border-color);">${c.trim()}</td>`).join('')}</tr>`;
        })
        // Headings
        .replace(/^### (.*$)/gim, '<h3 style="font-size:18px; margin:16px 0 8px 0; color:var(--text-primary);">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 style="font-size:22px; margin:20px 0 10px 0; border-bottom:1px solid var(--border-color); padding-bottom:6px; color:var(--text-primary);">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 style="font-size:26px; margin:24px 0 12px 0; border-bottom:1px solid var(--border-color); padding-bottom:8px; color:var(--text-primary);">$1</h1>')
        // Callout (> [!NOTE])
        .replace(/^> \[!(.*?)\]\n> (.*$)/gim, '<div style="background:rgba(56,139,253,0.1); border-left:4px solid var(--accent-hover); padding:12px 16px; border-radius:4px; margin:12px 0;"><strong>$1</strong>: $2</div>')
        // Basic formatting
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/~~(.*?)~~/g, '<del>$1</del>')
        .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width:100%; border-radius:8px; margin:12px 0; box-shadow:0 4px 16px rgba(0,0,0,0.3);" />')
        .replace(/\[\[(.*?)\]\]/g, '<span class="wikilink" data-link="$1">[[ $1 ]]</span>')
        .replace(/\n/g, '<br/>');

      // Use replace with global RegExp replacer function to avoid treating $1 / $$ as replacement backreferences
      placeholders.forEach((ph, i) => {
        rendered = rendered.replace(new RegExp(`___BLOCK_${i}___`, 'g'), () => ph);
      });

      return { __html: rendered };
    } catch (err) {
      console.error('Failed rendering markdown:', err);
      return { __html: '<div style="color:var(--danger); padding:12px;">Failed to render note content preview.</div>' };
    }
  };

  const wikiSuggestions = wikiSearch !== null
    ? allNotes.filter(n => n.title.toLowerCase().includes(wikiSearch))
    : [];

  return (
    <div 
      style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)', position: 'relative' }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Top Notesnook Formatting Toolbar */}
      <EditorToolbar
        lang={lang}
        fontSize={fontSize}
        setFontSize={setFontSize}
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
        paragraphType={paragraphType}
        setParagraphType={setParagraphType}
        onInsertText={insertText}
        onInsertTemplate={(tmpl) => handleContentChange(content + tmpl)}
        onToggleOutline={() => setShowOutline(!showOutline)}
        showOutline={showOutline}
        onOpenAICopilot={() => setAiModalOpen(true)}
        onOpenAudioRecorder={() => setAudioModalOpen(true)}
        onExportPDF={() => exportNoteToPDF(note)}
        onExportHTML={() => exportNoteToHTML(note)}
        onOpenHistory={onOpenHistory}
      />

      {/* WikiLink Autocomplete Popup */}
      {wikiSearch !== null && wikiSuggestions.length > 0 && (
        <div 
          role="listbox"
          aria-label="WikiLink Autocomplete Suggestions"
          style={{ position: 'absolute', top: '120px', left: '160px', zIndex: 100, background: 'var(--bg-secondary)', border: '1px solid var(--border-focus)', borderRadius: '8px', width: '260px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', padding: '6px 0' }}
        >
          <div style={{ padding: '4px 12px', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Link Note ([[WikiLink]])
          </div>
          {wikiSuggestions.map(s => (
            <div
              key={s.id}
              role="option"
              aria-selected="false"
              style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer', transition: 'background 0.15s ease' }}
              onMouseDown={() => insertWikiLink(s.title)}
            >
              [[ {s.title} ]]
            </div>
          ))}
        </div>
      )}

      {/* Editor Sub-Header Actions */}
      <div style={{ padding: '8px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)', fontSize: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Folder size={14} color="var(--text-muted)" aria-hidden="true" />
          <select
            value={folderId}
            aria-label="Assign Folder"
            onChange={(e) => {
              setFolderId(e.target.value);
              onUpdateNote({ ...note, folder: e.target.value, updatedAt: Date.now() });
            }}
            style={{ background: 'transparent', color: 'var(--text-primary)', border: 'none', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
          >
            <option value="">{t('unfiled', lang)}</option>
            {folders.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>

          <span style={{ color: 'var(--border-color)' }}>|</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={13} color={saveStatus === 'saved' ? 'var(--success)' : 'var(--warning)'} aria-hidden="true" />
            <span>{saveStatus === 'saved' ? t('autoSaved', lang) : t('saving', lang)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className="btn-icon"
            onClick={() => onLockVaultNote(note)}
            title={note.isEncrypted ? t('encryptedVault', lang) : t('lockVault', lang)}
            aria-label={note.isEncrypted ? t('encryptedVault', lang) : t('lockVault', lang)}
          >
            {note.isEncrypted ? <Lock size={16} color="var(--vault-purple)" aria-hidden="true" /> : <Unlock size={16} aria-hidden="true" />}
          </button>

          <button 
            className="btn" 
            onClick={() => setIsPreview(!isPreview)} 
            aria-label={isPreview ? "Switch to edit mode" : "Switch to preview mode"}
            style={{ padding: '4px 10px', fontSize: '12px' }}
          >
            {isPreview ? <Edit3 size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
            <span>{isPreview ? t('edit', lang) : t('preview', lang)}</span>
          </button>
          
          <button 
            className="btn" 
            onClick={() => {
              const currentTables = extractMarkdownTables(content);
              if (!showTableEditor && currentTables.length === 0) {
                handleContentChange(content + '\n| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |\n');
              }
              setShowTableEditor(!showTableEditor);
            }} 
            aria-label="Toggle visual table editor"
            style={{ padding: '4px 10px', fontSize: '12px', background: showTableEditor ? 'var(--bg-hover)' : undefined }}
          >
            <span>Table Editor</span>
          </button>

          <button 
            className="btn" 
            onClick={() => setUseBlockEditor(!useBlockEditor)} 
            aria-label={useBlockEditor ? "Switch to markdown mode" : "Switch to block mode"}
            style={{ padding: '4px 10px', fontSize: '12px' }}
          >
            <span>{useBlockEditor ? 'Markdown Mode' : 'Block Mode'}</span>
          </button>

          <button 
            className="btn-icon" 
            onClick={() => { if(window.confirm('Are you sure you want to delete this note?')) { onDeleteNote(note.id); } }} 
            title="Delete Note" 
            aria-label="Delete note"
            style={{ color: 'var(--danger)' }}
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 48px', maxWidth: '850px', margin: '0 auto', width: '100%' }}>
          <PageBanner 
            banner={note.banner} 
            onUpdateBanner={(b) => onUpdateNote({ ...note, banner: b, updatedAt: Date.now() })} 
          />

          <input
            type="text"
            value={title}
            aria-label="Note Title"
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Title..."
            style={{
              width: '100%',
              fontSize: '36px',
              fontWeight: '700',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              outline: 'none',
              marginBottom: '8px',
              fontFamily: fontFamily
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
            {(note.tags || []).map(tag => (
              <span key={tag} className="tag-badge" style={{ fontSize: '12px' }}>
                <TagIcon size={11} aria-hidden="true" />
                #{tag}
                <button 
                  aria-label={`Remove tag ${tag}`}
                  style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', marginLeft: '4px' }}
                  onClick={() => handleRemoveTag(tag)}
                >
                  ×
                </button>
              </span>
            ))}

            <input
              type="text"
              value={newTagInput}
              aria-label="Add Tag"
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder={t('addTag', lang)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>

          <ErrorBoundary fallbackTitle="Editor component failed to load">
            {useBlockEditor ? (
              <BlockEditor
                note={note}
                onChange={(md, newBlocks) => {
                  setContent(md);
                  setSaveStatus('saving');
                  if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
                  timeoutIdRef.current = setTimeout(() => {
                    if (currentNoteIdRef.current !== note.id) return;
                    onUpdateNote({
                      ...note,
                      title,
                      content: md,
                      blocks: newBlocks,
                      folder: folderId,
                      updatedAt: Date.now()
                    });
                    setSaveStatus('saved');
                  }, 300);
                }}
              />
            ) : isPreview ? (
              <div 
                className="editor-preview note-content"
                style={{ fontSize: `${fontSize}px`, fontFamily: fontFamily, lineHeight: 1.7, color: 'var(--text-primary)' }}
                dangerouslySetInnerHTML={renderMarkdown(content)}
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.classList.contains('wikilink')) {
                    const linkTitle = target.getAttribute('data-link');
                    if (linkTitle) onSelectNoteByTitle(linkTitle);
                  } else if (target.classList.contains('task-checkbox')) {
                    const idxStr = target.getAttribute('data-task-index');
                    if (idxStr !== null) {
                      const idxToToggle = parseInt(idxStr, 10);
                      let currentIndex = 0;
                      const newContent = content.replace(/^- \[([ x])\]/gim, (match, checkedStr) => {
                        if (currentIndex === idxToToggle) {
                          currentIndex++;
                          return checkedStr.toLowerCase() === 'x' ? '- [ ]' : '- [x]';
                        }
                        currentIndex++;
                        return match;
                      });
                      handleContentChange(newContent);
                    }
                  }
                }}
              />
            ) : (
              <div>
                <CodeMirrorEditor
                  content={content}
                  onChange={handleContentChange}
                  fontSize={fontSize}
                  fontFamily={fontFamily}
                  allNotes={allNotes}
                />

                {(showTableEditor || extractMarkdownTables(content).length > 0) && (
                  <div style={{ marginTop: '20px' }}>
                    {extractMarkdownTables(content).map((tbl, i) => (
                      <TableEditor
                        key={`${i}-${tbl.index}`}
                        initialMarkdown={tbl.raw}
                        onUpdateTable={(newTableMd) => {
                          const newContent = content.replace(tbl.raw, newTableMd);
                          handleContentChange(newContent);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </ErrorBoundary>

          <BacklinksPanel
            currentNote={note}
            allNotes={allNotes}
            onSelectNote={(id) => onSelectNoteByTitle(allNotes.find(n => n.id === id)?.title || '')}
          />
        </div>

        {showOutline && (
          <ErrorBoundary fallbackTitle="Document Outline failed to render">
            <DocumentOutline content={content} lang={lang} />
          </ErrorBoundary>
        )}
      </div>

      {/* Editor Bottom Status Bar with Word Count & Reading Time */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 16px',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        fontSize: '11px',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>Words: <strong style={{ color: 'var(--text-primary)' }}>{content.trim() ? content.trim().split(/\s+/).length : 0}</strong></span>
          <span>Chars: <strong style={{ color: 'var(--text-primary)' }}>{content.length}</strong></span>
          <span>Reading Time: <strong style={{ color: 'var(--text-primary)' }}>~{Math.max(1, Math.ceil((content.trim() ? content.trim().split(/\s+/).length : 0) / 200))} min</strong></span>
        </div>
        <div>
          <span>Storage: LocalFirst &amp; Sync</span>
        </div>
      </div>

      <AICopilotModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        contextNoteContent={content}
        onInsertResult={(res) => handleContentChange(content + res)}
        lang={lang}
      />

      <AudioRecorderModal
        isOpen={audioModalOpen}
        onClose={() => setAudioModalOpen(false)}
        onInsertAudio={(audioTag) => handleContentChange(content + audioTag)}
      />

      <DataviewBuilderModal
        isOpen={dataviewModalOpen}
        onClose={() => setDataviewModalOpen(false)}
        onInsertQuery={(queryCode) => handleContentChange(content + '\n' + queryCode)}
        availableTags={Array.from(new Set(allNotes.flatMap(n => n.tags || [])))}
      />
    </div>
  );
};
