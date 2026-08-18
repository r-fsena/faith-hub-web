import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '32px 24px',
          background: '#ffffff',
          borderRadius: '20px',
          border: '1.5px solid #fecaca',
          boxShadow: '0 10px 25px rgba(239, 68, 68, 0.08)',
          margin: '20px',
          textAlign: 'center',
          maxWidth: '640px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#fef2f2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.6rem',
            margin: '0 auto 16px'
          }}>
            ⚠️
          </div>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#991b1b', margin: '0 0 8px 0' }}>
            {this.props.fallbackTitle || 'Ocorreu um erro ao carregar este módulo'}
          </h3>

          <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '0 0 20px 0', lineHeight: 1.5 }}>
            {this.state.error?.message || 'Falha temporária de renderização. Suas outras abas continuam ativas.'}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={this.handleReset}
              style={{
                background: '#0f766e',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 20px',
                fontWeight: 800,
                fontSize: '0.84rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(15, 118, 110, 0.2)'
              }}
            >
              🔄 Tentar Recarregar Módulo
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                padding: '10px 20px',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer'
              }}
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
