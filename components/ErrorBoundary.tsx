"use client";
import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertCircle, RefreshCw, Mail } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      
      const errorMsg = this.state.error?.message || "An unexpected error occurred.";
      const mailto = `mailto:hello@truzot.com?subject=Truzot Error: ${encodeURIComponent(errorMsg.substring(0, 50))}&body=${encodeURIComponent("I encountered this error:\n" + errorMsg)}`;

      return (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-[var(--shadow-md)] max-w-md mx-auto my-12">
          <div className="w-16 h-16 bg-[var(--error)]/10 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="text-[var(--error)] w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-[var(--text)] mb-3">Something went wrong</h3>
          <p className="text-sm text-[var(--text-muted)] mb-8 font-medium">
            {errorMsg}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-5 py-2.5 bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] rounded-xl text-sm font-bold hover:bg-[var(--surface3)] transition flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
            <a
              href={mailto}
              className="px-5 py-2.5 bg-[var(--lime)] text-black rounded-xl text-sm font-bold hover:brightness-110 transition flex items-center gap-2"
            >
              <Mail className="w-4 h-4" /> Contact Support
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
