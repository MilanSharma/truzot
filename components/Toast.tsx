"use client";
import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContextType {
  toast: (message: string, type?: "success" | "error" | "info") => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const DURATION = 4000;

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    const id = nextId.current++;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), DURATION);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              className="pointer-events-auto relative overflow-hidden bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-lg)] rounded-2xl w-[320px] flex items-start p-4"
            >
              <div className="shrink-0 mr-3 mt-0.5">
                {t.type === "success" && <CheckCircle className="w-5 h-5 text-[var(--success)]" />}
                {t.type === "error" && <AlertCircle className="w-5 h-5 text-[var(--error)]" />}
                {t.type === "info" && <Info className="w-5 h-5 text-[var(--indigo)]" />}
              </div>
              <div className="flex-1 pr-6">
                <p className="text-sm font-bold text-[var(--text)]">{t.message}</p>
              </div>
              <button onClick={() => removeToast(t.id)} className="absolute top-4 right-4 text-[var(--text-faint)] hover:text-[var(--text)] transition">
                <X className="w-4 h-4" />
              </button>
              {/* Progress Bar Micro-interaction */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--surface2)]">
                <motion.div 
                  initial={{ width: "100%" }} 
                  animate={{ width: "0%" }} 
                  transition={{ duration: DURATION / 1000, ease: "linear" }}
                  className={`h-full ${t.type === 'success' ? 'bg-[var(--success)]' : t.type === 'error' ? 'bg-[var(--error)]' : 'bg-[var(--indigo)]'}`}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
