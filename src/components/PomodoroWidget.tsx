import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { toast } from '../utils/toast';

export const PomodoroWidget: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');

  useEffect(() => {
    let timer: any = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      if (mode === 'work') {
        toast.success('🎉 Pomodoro Session Completed! Take a 5 min break.');
        setMode('break');
        setTimeLeft(5 * 60);
      } else {
        toast.info('💪 Break over! Back to work.');
        setMode('work');
        setTimeLeft(25 * 60);
      }
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, mode]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '4px 10px',
      background: 'var(--bg-tertiary)',
      borderRadius: '8px',
      border: '1px solid var(--border-color)',
      fontSize: '12px'
    }}>
      <Timer size={14} style={{ color: mode === 'work' ? '#f85149' : '#2ea043' }} />
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
        {formattedTime}
      </span>
      <button className="btn-icon" style={{ padding: '2px' }} onClick={() => setIsRunning(!isRunning)} title={isRunning ? 'Pause' : 'Start'}>
        {isRunning ? <Pause size={12} /> : <Play size={12} />}
      </button>
      <button className="btn-icon" style={{ padding: '2px' }} onClick={resetTimer} title="Reset">
        <RotateCcw size={12} />
      </button>
    </div>
  );
};
