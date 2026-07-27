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

interface EditorProps {
  note: Note | null;
  folders: FolderType[];
  onUpdateNote: (updatedNote: Note) => void;
  onDeleteNote: (id: string) => void;
  allNotes: Note[];
  onSelectNoteByTitle: (title: string) => void;
  onLockVaultNote: (note: Note) => void;
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
  lang
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [folderId, setFolderId] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [showOutline, setShowOutline] = useState(false);

  // WikiLink Autocomplete Popup state
  const [wikiSearch, setWikiSearch] = useState<string | null>(null);
  const [wikiPopupPos, setWikiPopupPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  
  // Modals
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [audioModalOpen, setAudioModalOpen] = useState(false);

  // Toolbar styles
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('var(--font-sans)');
  const [paragraphType, setParagraphType] = useState('paragraph');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const contentRef = useRef(content);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setFolderId(note.folder || '');
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
      onUpdateNote({
        ...note,
        title,
        content: newContent,
        folder: folderId,
        tags: combinedTags,
        updatedAt: Date.now()
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
      if (!note.tags.includes(cleanTag)) {
        const updatedTags = [...note.tags, cleanTag];
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
    const updatedTags = note.tags.filter(t => t !== tagToRemove);
    onUpdateNote({
      ...note,
      tags: updatedTags,
      updatedAt: Date.now()
    });
  };

  // Base64 Image Attachment Handler
  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      const markdownImage = `\n![${file.name}](${base64Data})\n`;
      handleContentChange(contentRef.current + markdownImage);
    };
    reader.readAsDataURL(file);
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

  // Rich Markdown Renderer with Dataview query block support
  const renderMarkdown = (text: string) => {
    let rendered = text
      .replace(/<(script|iframe)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
      .replace(/\bon[a-z]+\s*=\s*"[^"]*"/gi, '')
      .replace(/\bon[a-z]+\s*=\s*'[^']*'/gi, '')
      .replace(/\bon[a-z]+\s*=\s*[^\s>]+/gi, '')
      .replace(/(href|src)\s*=\s*"javascript:[^"]*"/gi, '$1="#"')
      .replace(/(href|src)\s*=\s*'javascript:[^']*'/gi, "$1='#'")
      .replace(/(href|src)\s*=\s*javascript:[^\s>]+/gi, '$1="#"')
      // Dataview Query Codeblocks ```dataview ... ```
      .replace(/```dataview\n([\s\S]*?)```/g, (_, queryStr) => {
        const queryRes = executeDataviewQuery(queryStr, allNotes, note.tasks || []);
        const rowsHtml = queryRes.rows.map(r => `<tr>${r.map(c => `<td style="padding:6px 12px; border:1px solid var(--border-color);">${c}</td>`).join('')}</tr>`).join('');
        const headersHtml = queryRes.headers ? `<thead><tr style="background:var(--bg-tertiary);">${queryRes.headers.map(h => `<th style="padding:6px 12px; border:1px solid var(--border-color);">${h}</th>`).join('')}</tr></thead>` : '';
        return `<div style="margin:14px 0; border:1px solid var(--border-color); border-radius:8px; overflow:hidden;"><div style="background:var(--bg-secondary); padding:8px 12px; font-size:12px; font-weight:600; color:var(--accent-hover);">📊 Dataview Query Result (${queryRes.totalCount} items)</div><table style="width:100%; border-collapse:collapse; font-size:12.5px;">${headersHtml}<tbody>${rowsHtml}</tbody></table></div>`;
      })
      // LaTeX Math Block $$ ... $$
      .replace(/\$\$\n?([\s\S]*?)\n?\$\$/g, '<div style="background:var(--bg-tertiary); padding:12px; border-radius:6px; font-family:var(--font-mono); color:var(--vault-purple); margin:12px 0; text-align:center; border:1px solid var(--border-color); font-size:16px;"><strong>$1</strong></div>')
      // Inline Math $ ... $
      .replace(/\$(?!\s)([^$]+?)(?<!\s)\$/g, '<code style="background:rgba(163,113,247,0.2); color:var(--vault-purple); padding:2px 6px; border-radius:4px;">$1</code>')
      // Codeblocks ``` ... ```
      .replace(/```([a-z]*)\n([\s\S]*?)```/g, '<pre style="background:#090d13; padding:14px; border-radius:8px; font-family:var(--font-mono); font-size:13px; color:#e6edf3; overflow-x:auto; margin:14px 0; border:1px solid var(--border-color);"><code>$2</code></pre>')
      // Task Lists (- [ ] or - [x])
      .replace(/^- \[ \] (.*$)/gim, '<div style="display:flex; align-items:center; gap:8px; margin:4px 0;"><input type="checkbox" disabled style="accent-color:var(--accent-primary); cursor:pointer;" /> <span>$1</span></div>')
      .replace(/^- \[x\] (.*$)/gim, '<div style="display:flex; align-items:center; gap:8px; margin:4px 0; text-decoration:line-through; opacity:0.6;"><input type="checkbox" checked disabled /> <span>$1</span></div>')
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

    return { __html: rendered };
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
      />

      {/* WikiLink Autocomplete Popup */}
      {wikiSearch !== null && wikiSuggestions.length > 0 && (
        <div style={{ position: 'absolute', top: '120px', left: '160px', zIndex: 100, background: 'var(--bg-secondary)', border: '1px solid var(--border-focus)', borderRadius: '8px', width: '260px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', padding: '6px 0' }}>
          <div style={{ padding: '4px 12px', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Link Note ([[WikiLink]])
          </div>
          {wikiSuggestions.map(s => (
            <div
              key={s.id}
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
          <Folder size={14} color="var(--text-muted)" />
          <select
            value={folderId}
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
            <CheckCircle2 size={13} color={saveStatus === 'saved' ? 'var(--success)' : 'var(--warning)'} />
            <span>{saveStatus === 'saved' ? t('autoSaved', lang) : t('saving', lang)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className="btn-icon"
            onClick={() => onLockVaultNote(note)}
            title={note.isEncrypted ? t('encryptedVault', lang) : t('lockVault', lang)}
          >
            {note.isEncrypted ? <Lock size={16} color="var(--vault-purple)" /> : <Unlock size={16} />}
          </button>

          <button className="btn" onClick={() => setIsPreview(!isPreview)} style={{ padding: '4px 10px', fontSize: '12px' }}>
            {isPreview ? <Edit3 size={14} /> : <Eye size={14} />}
            <span>{isPreview ? t('edit', lang) : t('preview', lang)}</span>
          </button>

          <button className="btn-icon" onClick={() => { if(window.confirm('Are you sure you want to delete this note?')) { onDeleteNote(note.id); } }} title="Delete Note" style={{ color: 'var(--danger)' }}>
            <Trash2 size={16} />
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
            {note.tags.map(tag => (
              <span key={tag} className="tag-badge" style={{ fontSize: '12px' }}>
                <TagIcon size={11} />
                #{tag}
                <button 
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

          {isPreview ? (
            <div 
              className="editor-preview note-content"
              style={{ fontSize: `${fontSize}px`, fontFamily: fontFamily, lineHeight: 1.7, color: 'var(--text-primary)' }}
              dangerouslySetInnerHTML={renderMarkdown(content)}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.classList.contains('wikilink')) {
                  const linkTitle = target.getAttribute('data-link');
                  if (linkTitle) onSelectNoteByTitle(linkTitle);
                }
              }}
            />
          ) : (
            <textarea
              ref={textareaRef}
              className="editor-textarea"
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Start writing... Use #tags, [[wiki-links]], - [ ] task lists, | tables |, or $math$ formulas."
              style={{ fontSize: `${fontSize}px`, fontFamily: fontFamily }}
            />
          )}

          <BacklinksPanel
            currentNote={note}
            allNotes={allNotes}
            onSelectNote={(id) => onSelectNoteByTitle(allNotes.find(n => n.id === id)?.title || '')}
          />
        </div>

        {showOutline && (
          <DocumentOutline content={content} lang={lang} />
        )}
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
    </div>
  );
};
