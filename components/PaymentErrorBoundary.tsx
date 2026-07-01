"use client";
import ErrorBoundary from "./ErrorBoundary";

export default function PaymentErrorBoundary({
 children,
}: {
 children: React.ReactNode;
}) {
 return (
 <ErrorBoundary
 fallback={
 <div className="flex flex-col items-center justify-center py-20 max-w-md mx-auto text-center">
 <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
 <span className="text-[var(--error)] text-2xl">!</span>
 </div>
 <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
 Payment Error
 </h3>
 <p className="text-sm text-[var(--text-secondary)] mb-6">
 An error occurred during payment processing. Your card has not been
 charged.
 </p>
 <button
 onClick={() => window.location.reload()}
 className="px-6 py-2.5 bg-[var(--lime)] text-black text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition"
 >
 Try Again
 </button>
 </div>
 }
 >
 {children}
 </ErrorBoundary>
 );
}
