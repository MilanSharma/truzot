"use client";
import { Component, type ReactNode, type ErrorInfo } from "react";
import * as Sentry from "@sentry/nextjs";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; stack?: string; }

export default class GalleryErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[GalleryErrorBoundary] render threw:", error, "\n", info.componentStack);
    try {
      Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
    } catch {}
    this.setState({ stack: info.componentStack ?? undefined });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const msg = this.state.error?.message ?? "Unknown render error";
    const isProd = process.env.NODE_ENV === "production";

    return (
      <div className="w-full rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-red-500 text-2xl">!</span>
        </div>
        <h2 className="text-2xl font-bold text-[var(--text)] mb-2">Gallery Error</h2>
        <p className="text-[var(--text-muted)] max-w-md mx-auto mb-4">
          Failed to render the headshot gallery. The real exception is below.
        </p>

        <details className="text-left max-w-2xl mx-auto mb-6 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3">
          <summary className="cursor-pointer text-xs font-mono text-red-600 dark:text-red-400 select-all">
            {msg}
          </summary>
          {!isProd && (
            <pre className="mt-2 text-[11px] leading-relaxed whitespace-pre-wrap break-words text-slate-600 dark:text-slate-300">
              {this.state.stack}
            </pre>
          )}
        </details>

        <button
          onClick={() => window.location.reload()}
          className="bg-lime-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-lime-600 transition"
        >
          Reload Page
        </button>
      </div>
    );
  }
}
