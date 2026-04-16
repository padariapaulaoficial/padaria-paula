'use client';

// ErrorBoundary - Captura erros de runtime
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-card rounded-2xl border border-border p-6 shadow-lg">
            <h1 className="text-xl font-bold text-destructive mb-4">
              Erro na Aplicação
            </h1>
            <div className="bg-muted rounded-lg p-4 mb-4 overflow-auto max-h-60">
              <p className="text-sm font-mono text-destructive">
                {this.state.error?.message || 'Erro desconhecido'}
              </p>
              {this.state.error?.stack && (
                <pre className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">
                  {this.state.error.stack}
                </pre>
              )}
            </div>
            <button
              onClick={() => {
                // Limpar localStorage e recarregar
                localStorage.clear();
                window.location.reload();
              }}
              className="w-full bg-primary text-primary-foreground font-semibold rounded-xl px-6 py-3 hover:bg-primary/90"
            >
              Limpar Cache e Recarregar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
