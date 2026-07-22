"use client";
import { Component, type ReactNode, type ErrorInfo } from "react";

export default class CardErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { failed: boolean; msg?: string }
> {
  state = { failed: false, msg: undefined as string | undefined };
  static getDerivedStateFromError(e: Error) { return { failed: true, msg: e.message }; }
  componentDidCatch(e: Error, info: ErrorInfo) {
    console.error("[CardErrorBoundary] one card threw:", e.message, info.componentStack);
  }
  render() {
    if (this.state.failed) {
      return this.props.fallback ?? (
        <div className="relative w-full h-full rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-400">
          unavailable
        </div>
      );
    }
    return this.props.children;
  }
}
