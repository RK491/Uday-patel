import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Application render error:', error, info.componentStack);
  }

  private handleReload = (): void => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-[#F7F6F2] dark:bg-[#0F1115] text-stone-900 dark:text-stone-100 flex items-center justify-center px-6">
        <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 text-center shadow-lg">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
            <RefreshCw className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-extrabold tracking-tight">Something went wrong</h1>
          <p className="mt-1.5 text-sm text-stone-600 dark:text-stone-400">
            The farm view hit an unexpected error. Reload to restore your session safely.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-bold text-stone-950 shadow-sm active:scale-[0.98] transition"
          >
            <RefreshCw className="h-4 w-4" />
            Reload Farm
          </button>
        </div>
      </div>
    );
  }
}
