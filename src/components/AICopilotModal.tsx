import React, { useState } from 'react';
import { Sparkles, Bot, X, Send, CornerDownLeft, Key, CheckCircle2 } from 'lucide-react';
import { generateAICopilotResponse } from '../utils/aiCopilot';
import { Language, t } from '../utils/i18n';

interface AICopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextNoteContent: string;
  onInsertResult: (text: string) => void;
  lang: Language;
}

export const AICopilotModal: React.FC<AICopilotModalProps> = ({
  isOpen,
  onClose,
  contextNoteContent,
  onInsertResult,
  lang
}) => {
  const [prompt, setPrompt] = useState('');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('kv_gemini_key') || 'AUTO_CONFIGURED');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [showKeyInput, setShowKeyInput] = useState(false);

  if (!isOpen) return null;

  const handleSaveKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('kv_gemini_key', key);
  };

  const handleGenerate = async (customPrompt?: string) => {
    const activePrompt = customPrompt || prompt;
    if (!activePrompt.trim()) return;

    setLoading(true);
    setResponse(null);

    const result = await generateAICopilotResponse(activePrompt, contextNoteContent, apiKey);
    setResponse(result);
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: '580px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a371f7' }}>
            <Sparkles size={20} />
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>AI Copilot Assistant</h3>
            <span className="tag-badge" style={{ background: 'rgba(46,160,67,0.15)', color: 'var(--success)', borderColor: 'rgba(46,160,67,0.3)', fontSize: '11px' }}>
              <CheckCircle2 size={11} /> Configured & Free
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button 
              className="btn-icon" 
              onClick={() => setShowKeyInput(!showKeyInput)} 
              title="Custom Gemini API Key (Optional)"
              style={{ color: 'var(--success)' }}
            >
              <Key size={16} />
            </button>
            <button className="btn-icon" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Optional Custom Key Input */}
        {showKeyInput && (
          <div style={{ padding: '10px 12px', background: 'var(--bg-tertiary)', borderRadius: '6px', marginBottom: '14px', fontSize: '12px' }}>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>
              Custom Google Gemini API Key (Optional):
            </label>
            <input
              type="password"
              className="input"
              placeholder="Paste custom Gemini API key..."
              value={apiKey === 'AUTO_CONFIGURED' ? '' : apiKey}
              onChange={(e) => handleSaveKey(e.target.value || 'AUTO_CONFIGURED')}
              style={{ fontSize: '12px' }}
            />
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              AI is pre-configured and 100% free out-of-the-box! No key required.
            </span>
          </div>
        )}

        {/* Quick 1-Click Action Buttons */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
          <button className="btn" style={{ fontSize: '11.5px', padding: '5px 10px' }} onClick={() => handleGenerate('Суммаризируй содержание заметки')}>
            📝 Резюме заметки
          </button>
          <button className="btn" style={{ fontSize: '11.5px', padding: '5px 10px' }} onClick={() => handleGenerate('Сгенерируй план и структуру')}>
            📌 План документа
          </button>
          <button className="btn" style={{ fontSize: '11.5px', padding: '5px 10px' }} onClick={() => handleGenerate('Создай список задач TODO')}>
            📋 Чеклист задач
          </button>
          <button className="btn" style={{ fontSize: '11.5px', padding: '5px 10px' }} onClick={() => handleGenerate('Идеи карточек для Canvas')}>
            💡 Карточки Canvas
          </button>
        </div>

        {/* Custom Prompt Input */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            type="text"
            className="input"
            placeholder="Спросите AI или введите запрос..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
          <button className="btn btn-primary" onClick={() => handleGenerate()} disabled={loading}>
            <Send size={15} />
          </button>
        </div>

        {/* Output Result Container */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
            <Sparkles size={24} style={{ animation: 'spin 2s linear infinite', marginBottom: '8px' }} />
            <p>AI Copilot обрабатывает ваш запрос...</p>
          </div>
        )}

        {response && (
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px', maxHeight: '220px', overflowY: 'auto', marginBottom: '16px', fontSize: '13px', lineHeight: '1.5' }}>
            <div dangerouslySetInnerHTML={{ __html: response.replace(/\n/g, '<br/>') }} />
          </div>
        )}

        {/* Actions Footer */}
        {response && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button className="btn btn-primary" onClick={() => { onInsertResult('\n\n' + response + '\n\n'); onClose(); }}>
              <CornerDownLeft size={14} />
              <span>Вставить в заметку</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
