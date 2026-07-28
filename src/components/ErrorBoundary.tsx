import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught Error in ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div 
          role="alert"
          style={{
            padding: '24px',
            margin: '16px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--danger)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <AlertTriangle size={36} color="var(--danger)" />
          <h3 style={{ margin: 0, fontSize: '18px' }}>
            {this.props.fallbackTitle || 'Something went wrong rendering this component'}
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', maxWidth: '500px' }}>
            {this.state.error?.message || this.props.fallbackMessage || 'An unexpected error occurred while rendering.'}
          </p>
          <button
            className="btn"
            onClick={this.handleReset}
            style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} />
            <span>Try Again</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
