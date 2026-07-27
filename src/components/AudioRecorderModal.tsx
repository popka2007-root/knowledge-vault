import React, { useState, useRef } from 'react';
import { Mic, Square, X, Play, Volume2 } from 'lucide-react';

interface AudioRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertAudio: (base64Audio: string) => void;
}

export const AudioRecorderModal: React.FC<AudioRecorderModalProps> = ({
  isOpen,
  onClose,
  onInsertAudio
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [base64Audio, setBase64Audio] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  if (!isOpen) return null;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        const reader = new FileReader();
        reader.onloadend = () => {
          setBase64Audio(reader.result as string);
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      alert('Microphone access denied or not available.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSave = () => {
    if (base64Audio) {
      onInsertAudio(`\n<audio controls src="${base64Audio}" style="width:100%; margin:12px 0;"></audio>\n`);
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: '400px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
            <Mic size={20} />
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Audio Note Recorder</h3>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '24px 0' }}>
          {!isRecording ? (
            <button 
              className="btn btn-primary" 
              onClick={startRecording}
              style={{ padding: '16px 24px', borderRadius: '50%', background: 'var(--danger)', borderColor: 'var(--danger)', margin: '0 auto' }}
            >
              <Mic size={28} />
            </button>
          ) : (
            <button 
              className="btn btn-primary" 
              onClick={stopRecording}
              style={{ padding: '16px 24px', borderRadius: '50%', background: 'var(--accent-primary)', borderColor: 'var(--accent-primary)', margin: '0 auto' }}
            >
              <Square size={28} />
            </button>
          )}

          <p style={{ marginTop: '14px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            {isRecording ? '🔴 Recording audio note...' : audioUrl ? 'Recording ready!' : 'Click mic button to start recording'}
          </p>
        </div>

        {audioUrl && (
          <div style={{ marginBottom: '16px' }}>
            <audio src={audioUrl} controls style={{ width: '100%' }} />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!base64Audio}>
            Insert Audio Note
          </button>
        </div>
      </div>
    </div>
  );
};
