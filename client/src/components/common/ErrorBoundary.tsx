import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '../ui/Button';

interface Props {
  children: ReactNode;
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
    console.error('EVENTORA Uncaught Error Boundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#09090F] text-[#F8FAFC] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#171723] border border-rose-500/30 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                An unexpected error occurred while rendering this view. Your session and data are secure.
              </p>
              {this.state.error?.message && (
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono text-rose-300 break-words text-left">
                  {this.state.error.message}
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="gradient"
                size="md"
                className="w-full"
                leftIcon={<RefreshCw className="w-4 h-4" />}
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
              <Button
                variant="outline"
                size="md"
                className="w-full"
                leftIcon={<Home className="w-4 h-4" />}
                onClick={() => {
                  window.location.href = '/';
                }}
              >
                Return Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
