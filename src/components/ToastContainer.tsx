import React, { useState, useEffect } from 'react';
import { toast, Toast } from '../utils/toast';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const [toastList, setToastList] = useState<Toast[]>([]);

  useEffect(() => {
    return toast.subscribe(setToastList);
  }, []);

  if (toastList.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      pointerEvents: 'none'
    }}>
      {toastList.map(t => {
        const icons = {
          success: <CheckCircle size={16} color="#2ea043" />,
          error: <XCircle size={16} color="#f85149" />,
          warning: <AlertTriangle size={16} color="#d29922" />,
          info: <Info size={16} color="#388bfd" />
        };

        return (
          <div
            key={t.id}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 16px',
              background: 'var(--bg-secondary)',
              backdropFilter: 'blur(12px)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              fontSize: '13px',
              fontWeight: 500,
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            {icons[t.type]}
            <span>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
};
