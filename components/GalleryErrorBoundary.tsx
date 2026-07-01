"use client";
import ErrorBoundary from "./ErrorBoundary";

export default function GalleryErrorBoundary({
 children,
}: {
 children: React.ReactNode;
}) {
 return (
 <ErrorBoundary
 fallback={
 <div className="flex flex-col items-center justify-center py-20 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-primary)] shadow-sm max-w-2xl mx-auto my-8">
 <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
 <span className="text-[var(--error)] text-2xl">!</span>
 </div>
 <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
 Gallery Error
 </h3>
 <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-md text-center">
 Failed to load headshot gallery. This may be a temporary issue.
 </p>
 <button
 onClick={() => window.location.reload()}
 className="px-6 py-2.5 bg-[var(--lime)] text-black text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition"
 >
 Reload Page
 </button>
 </div>
 }
 >
 {children}
 </ErrorBoundary>
 );
}
