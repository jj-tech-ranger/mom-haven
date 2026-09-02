// src/components/common/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, PhoneCall } from 'lucide-react';

interface Props {
  children: ReactNode;
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
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in MomHaven component tree:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-rose-50/50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-rose-100 shadow-xl shadow-rose-900/5 text-center">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              MomHaven encountered an unexpected display issue. Your stored clinical records and data remain safe.
            </p>

            {/* Emergency Support Notice */}
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-6 text-left">
              <div className="flex items-center gap-2 text-rose-800 font-semibold text-xs uppercase tracking-wider mb-1">
                <PhoneCall className="w-4 h-4" /> Emergency Healthcare Notice
              </div>
              <p className="text-xs text-rose-700 leading-relaxed">
                If you are experiencing medical danger signs or active labor, do not rely on this digital screen. Call <strong>1199 / 999</strong> or visit your nearest hospital maternity ward immediately.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReload}
                className="w-full py-3.5 px-4 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <RefreshCw className="w-4 h-4" /> Reload Application
              </button>
            </div>

            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <details className="mt-6 text-left bg-gray-50 p-3 rounded-xl text-xs text-gray-700 border border-gray-200 overflow-auto max-h-36">
                <summary className="font-mono cursor-pointer text-gray-500 font-semibold mb-1">Developer Error Details</summary>
                <p className="font-mono text-rose-600 font-semibold">{this.state.error.toString()}</p>
                <pre className="mt-2 text-[10px] text-gray-500">{this.state.errorInfo?.componentStack}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
