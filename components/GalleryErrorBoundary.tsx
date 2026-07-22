"use client";
import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export default class GalleryErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[GalleryErrorBoundary] render threw:", error, "\n", info.componentStack);
    console.error("[GalleryErrorBoundary] Error details:", {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex flex-col items-center justify-center py-20 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-primary)] shadow-sm max-w-2xl mx-auto my-8">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <span className="text-[var(--error)] text-2xl">!</span>
        </div>
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
          Gallery Error
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mb-4 max-w-md text-center">
          Failed to load headshot gallery. This may be a temporary issue.
        </p>
        {this.state.error && (
          <details className="mb-6 text-xs text-slate-500 max-w-md text-left">
            <summary className="cursor-pointer hover:text-slate-700">Error details</summary>
            <pre className="mt-2 p-2 bg-slate-100 rounded overflow-auto">
              {this.state.error.message}
            </pre>
          </details>
        )}
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-[var(--lime)] text-black text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition"
        >
          Reload Page
        </button>
      </div>
    );
  }
}
