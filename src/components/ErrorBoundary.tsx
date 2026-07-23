import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught React exception:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-canvas-obsidian flex items-center justify-center p-6 text-center text-ink-navy">
          <div className="bg-canvas-pure border border-ice-border rounded-lg max-w-md w-full p-8 shadow-premium space-y-6">
            <div className="w-16 h-16 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="font-outfit font-light text-2xl tracking-tight text-ink-navy">
                Application Error
              </h2>
              <p className="text-xs font-mono text-zinc-400 leading-relaxed">
                An unexpected component runtime exception occurred. The system has prevented a full application crash.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-sm text-[10px] font-mono text-left overflow-x-auto max-h-24">
                {this.state.error.toString()}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-3 bg-cobalt hover:bg-cobalt-hover text-white text-xs font-bold font-mono rounded-sm transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Application State
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
