import React, { useState } from 'react';
import { 
  Plus, 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  MoreHorizontal, 
  Minus, 
  ChevronDown, 
  List, 
  ListOrdered, 
  CheckSquare, 
  Link, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Pilcrow, 
  Maximize2,
  Table as TableIcon,
  Code,
  Sigma,
  MessageSquareQuote,
  Palette,
  Sparkles,
  Mic,
  Printer,
  Download,
  History
} from 'lucide-react';
import { Language, t } from '../utils/i18n';

interface EditorToolbarProps {
  lang: Language;
  fontSize: number;
  setFontSize: (size: number) => void;
  fontFamily: string;
  setFontFamily: (font: string) => void;
  paragraphType: string;
  setParagraphType: (type: string) => void;
  onInsertText: (prefix: string, suffix?: string) => void;
  onInsertTemplate: (template: string) => void;
  onToggleOutline: () => void;
  showOutline: boolean;
  onOpenAICopilot: () => void;
  onOpenAudioRecorder: () => void;
  onExportPDF: () => void;
  onExportHTML: () => void;
  onOpenHistory?: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  lang,
  fontSize,
  setFontSize,
  fontFamily,
  setFontFamily,
  paragraphType,
  setParagraphType,
  onInsertText,
  onInsertTemplate,
  onToggleOutline,
  showOutline,
  onOpenAICopilot,
  onOpenAudioRecorder,
  onExportPDF,
  onExportHTML,
  onOpenHistory
}) => {
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleParagraphChange = (type: string) => {
    setParagraphType(type);
    if (type === 'h1') onInsertText('# ');
    else if (type === 'h2') onInsertText('## ');
    else if (type === 'h3') onInsertText('### ');
    else if (type === 'quote') onInsertText('> ');
    else if (type === 'callout') onInsertText('> [!NOTE]\n> ');
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '8px 12px',
      background: '#181c24',
      borderBottom: '1px solid var(--border-color)',
      flexWrap: 'wrap',
      fontSize: '13px',
      color: '#e6edf3'
    }}>
      {/* 1. Insert (+) Menu */}
      <div style={{ position: 'relative' }}>
        <button 
          className="btn-icon" 
          onClick={() => setShowPlusMenu(!showPlusMenu)}
          style={{ color: '#2f81f7', fontWeight: 'bold' }}
          title={t('insertElement', lang)}
        >
          <Plus size={18} />
        </button>

        {showPlusMenu && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '4px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '6px',
            zIndex: 100,
            width: '200px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
          }}>
            <button 
              className="btn" 
              style={{ width: '100%', justifyContent: 'flex-start', border: 'none', background: 'transparent' }}
              onClick={() => { onInsertTemplate('\n- [ ] Task item 1\n- [ ] Task item 2\n'); setShowPlusMenu(false); }}
            >
              <CheckSquare size={15} color="#388bfd" />
              <span>{t('taskList', lang)}</span>
            </button>

            <button 
              className="btn" 
              style={{ width: '100%', justifyContent: 'flex-start', border: 'none', background: 'transparent' }}
              onClick={() => { onInsertTemplate('\n| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |\n'); setShowPlusMenu(false); }}
            >
              <TableIcon size={15} color="#2ea043" />
              <span>{t('table', lang)}</span>
            </button>

            <button 
              className="btn" 
              style={{ width: '100%', justifyContent: 'flex-start', border: 'none', background: 'transparent' }}
              onClick={() => { onInsertTemplate('\n$$\nE = mc^2\n$$\n'); setShowPlusMenu(false); }}
            >
              <Sigma size={15} color="#a371f7" />
              <span>{t('mathFormula', lang)}</span>
            </button>

            <button 
              className="btn" 
              style={{ width: '100%', justifyContent: 'flex-start', border: 'none', background: 'transparent' }}
              onClick={() => { onInsertTemplate('\n```javascript\nconsole.log("Hello Knowledge Vault");\n```\n'); setShowPlusMenu(false); }}
            >
              <Code size={15} color="#e3b341" />
              <span>{t('codeBlock', lang)}</span>
            </button>

            <button 
              className="btn" 
              style={{ width: '100%', justifyContent: 'flex-start', border: 'none', background: 'transparent' }}
              onClick={() => { onInsertTemplate('\n> [!TIP]\n> Important insight or note here.\n'); setShowPlusMenu(false); }}
            >
              <MessageSquareQuote size={15} color="#f0883e" />
              <span>{t('callout', lang)}</span>
            </button>
          </div>
        )}
      </div>

      <span className="toolbar-divider" style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 2px' }} />

      {/* AI Assistant Button */}
      <button className="btn-icon" onClick={onOpenAICopilot} title={t('aiCopilot', lang)} style={{ color: '#a371f7' }}>
        <Sparkles size={16} />
      </button>

      {/* Audio Recorder Button */}
      <button className="btn-icon" onClick={onOpenAudioRecorder} title={t('recordVoiceNote', lang)} style={{ color: '#f85149' }}>
        <Mic size={16} />
      </button>

      <span className="toolbar-divider" style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 2px' }} />

      {/* Basic Formatting Buttons: B, I, U, S */}
      <button className="btn-icon" onClick={() => onInsertText('**', '**')} title={t('bold', lang)}>
        <Bold size={16} />
      </button>
      <button className="btn-icon" onClick={() => onInsertText('*', '*')} title={t('italic', lang)}>
        <Italic size={16} />
      </button>
      <button className="btn-icon" onClick={() => onInsertText('<u>', '</u>')} title={t('underline', lang)}>
        <UnderlineIcon size={16} />
      </button>
      <button className="btn-icon" onClick={() => onInsertText('~~', '~~')} title={t('strikethrough', lang)}>
        <Strikethrough size={16} />
      </button>

      {/* More Formatting Dropdown (Highlight Colors) */}
      <div style={{ position: 'relative' }}>
        <button className="btn-icon" onClick={() => setShowHighlightMenu(!showHighlightMenu)} title={t('textHighlight', lang)}>
          <Palette size={16} color="#a371f7" />
        </button>

        {showHighlightMenu && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '4px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '6px',
            zIndex: 100,
            display: 'flex',
            gap: '6px'
          }}>
            <button style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(163,113,247,0.5)', border: 'none', cursor: 'pointer' }} onClick={() => { onInsertText('<mark style="background:rgba(163,113,247,0.4); color:#fff; padding:2px 4px; border-radius:3px;">', '</mark>'); setShowHighlightMenu(false); }} title={t('highlightPurple', lang)} />
            <button style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(227,179,65,0.5)', border: 'none', cursor: 'pointer' }} onClick={() => { onInsertText('<mark style="background:rgba(227,179,65,0.4); color:#fff; padding:2px 4px; border-radius:3px;">', '</mark>'); setShowHighlightMenu(false); }} title={t('highlightYellow', lang)} />
            <button style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(46,160,67,0.5)', border: 'none', cursor: 'pointer' }} onClick={() => { onInsertText('<mark style="background:rgba(46,160,67,0.4); color:#fff; padding:2px 4px; border-radius:3px;">', '</mark>'); setShowHighlightMenu(false); }} title={t('highlightGreen', lang)} />
            <button style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(56,139,253,0.5)', border: 'none', cursor: 'pointer' }} onClick={() => { onInsertText('<mark style="background:rgba(56,139,253,0.4); color:#fff; padding:2px 4px; border-radius:3px;">', '</mark>'); setShowHighlightMenu(false); }} title={t('highlightBlue', lang)} />
          </div>
        )}
      </div>

      <span className="toolbar-divider" style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 2px' }} />

      {/* Font Size Controls - Hidden on small screens unless expanded */}
      <div className={isExpanded ? '' : 'hide-on-mobile'} style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
        <button className="btn-icon" style={{ padding: '1px' }} onClick={() => setFontSize(Math.max(12, fontSize - 1))}>
          <Minus size={12} />
        </button>
        <span style={{ fontSize: '12px', minWidth: '32px', textAlign: 'center' }}>{fontSize}px</span>
        <button className="btn-icon" style={{ padding: '1px' }} onClick={() => setFontSize(Math.min(32, fontSize + 1))}>
          <Plus size={12} />
        </button>
      </div>

      <span className={isExpanded ? 'toolbar-divider' : 'hide-on-mobile'} style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 2px' }} />

      {/* Paragraph Dropdown */}
      <select
        className={isExpanded ? '' : 'hide-on-mobile'}
        value={paragraphType}
        onChange={(e) => handleParagraphChange(e.target.value)}
        style={{
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          padding: '3px 8px',
          fontSize: '12px',
          outline: 'none',
          cursor: 'pointer'
        }}
      >
        <option value="paragraph">{t('paragraph', lang)}</option>
        <option value="h1">{t('heading1', lang)}</option>
        <option value="h2">{t('heading2', lang)}</option>
        <option value="h3">{t('heading3', lang)}</option>
        <option value="quote">{t('callout', lang)}</option>
      </select>

      {/* Font Family Dropdown */}
      <select
        className={isExpanded ? '' : 'hide-on-mobile'}
        value={fontFamily}
        onChange={(e) => setFontFamily(e.target.value)}
        style={{
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          padding: '3px 8px',
          fontSize: '12px',
          outline: 'none',
          cursor: 'pointer'
        }}
      >
        <option value="var(--font-sans)">{t('sansSerif', lang)}</option>
        <option value="Georgia, serif">{t('serif', lang)}</option>
        <option value="var(--font-mono)">{t('monospace', lang)}</option>
      </select>

      <span className={isExpanded ? 'toolbar-divider' : 'hide-on-mobile'} style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 2px' }} />

      {/* List Controls */}
      <div className={isExpanded ? '' : 'hide-on-mobile'} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button className="btn-icon" onClick={() => onInsertText('\n- ')} title={t('bulletList', lang)}>
          <List size={16} />
        </button>
        <button className="btn-icon" onClick={() => onInsertText('\n1. ')} title={t('numberedList', lang)}>
          <ListOrdered size={16} />
        </button>
        <button className="btn-icon" onClick={() => onInsertText('\n- [ ] ')} title={t('taskCheckboxList', lang)}>
          <CheckSquare size={16} />
        </button>
      </div>

      {/* WikiLink */}
      <button className="btn-icon" onClick={() => onInsertText('[[', ']]')} title={t('insertWikiLink', lang)}>
        <Link size={16} color="#388bfd" />
      </button>

      <span className="toolbar-divider" style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 2px' }} />

      {/* PDF / HTML Export & Version History Buttons */}
      <button className="btn-icon" onClick={onExportPDF} title={t('exportPDF', lang)}>
        <Printer size={16} />
      </button>
      <button className="btn-icon" onClick={onExportHTML} title={t('exportHTML', lang)}>
        <Download size={16} />
      </button>
      {onOpenHistory && (
        <button className="btn-icon" onClick={onOpenHistory} title={t('versionHistory', lang)}>
          <History size={16} color="var(--accent-hover)" />
        </button>
      )}

      {/* Outline Map Toggle */}
      <button 
        className={`btn-icon ${showOutline ? 'active' : ''}`} 
        onClick={onToggleOutline} 
        style={{ color: showOutline ? 'var(--accent-hover)' : 'inherit' }}
        title={t('outline', lang)}
      >
        <Pilcrow size={16} />
      </button>

      {/* Mobile Expand Toggle */}
      <button 
        className="btn-icon mobile-only" 
        onClick={() => setIsExpanded(!isExpanded)} 
        title={t('toggleMoreTools', lang)}
      >
        <MoreHorizontal size={16} />
      </button>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .hide-on-mobile { display: none !important; }
          .mobile-only { display: inline-flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-only { display: none !important; }
        }
      `}} />
    </div>
  );
};
