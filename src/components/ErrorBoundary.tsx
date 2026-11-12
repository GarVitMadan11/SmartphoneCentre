import { Component, ErrorInfo, ReactNode } from 'react';
import { ServerErrorPage } from './common/ServerErrorPage';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isChunkError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    isChunkError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    const msg = error?.message || '';
    const isChunkError =
      /dynamically imported module/i.test(msg) ||
      /loading chunk/i.test(msg) ||
      /chunkloaderror/i.test(error?.name || '') ||
      (/failed to fetch/i.test(msg) && (error instanceof TypeError || /module|chunk|script/i.test(msg)));

    return { hasError: true, error, isChunkError };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught React exception:', error, errorInfo);

    const msg = error?.message || '';
    const isChunkError =
      /dynamically imported module/i.test(msg) ||
      /loading chunk/i.test(msg) ||
      /chunkloaderror/i.test(error?.name || '') ||
      (/failed to fetch/i.test(msg) && (error instanceof TypeError || /module|chunk|script/i.test(msg)));

    if (isChunkError) {
      const attempts = parseInt(sessionStorage.getItem('rex_chunk_eb_reload') || '0', 10);
      if (attempts < 1) {
        sessionStorage.setItem('rex_chunk_eb_reload', String(attempts + 1));
        window.location.reload();
      }
    }
  }

  private handleReset = () => {
    sessionStorage.removeItem('rex_chunk_eb_reload');
    sessionStorage.removeItem('rex_chunk_reload_attempts');
    this.setState({ hasError: false, error: null, isChunkError: false });
    window.location.reload();
  };

  private handleGoHome = () => {
    sessionStorage.removeItem('rex_chunk_eb_reload');
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <ServerErrorPage
          error={this.state.error}
          onReset={this.handleReset}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return this.props.children;
  }
}
