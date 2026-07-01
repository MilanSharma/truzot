"use client";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface PromptModalProps {
 isOpen: boolean;
 title: string;
 message: string;
 placeholder?: string;
 initialValue?: string;
 confirmText?: string;
 onConfirm: (value: string) => void;
 onCancel: () => void;
}

export default function PromptModal({
 isOpen,
 title,
 message,
 placeholder = "",
 initialValue = "",
 confirmText = "Save",
 onConfirm,
 onCancel,
}: PromptModalProps) {
 const [value, setValue] = useState(initialValue);
 const inputRef = useRef<HTMLInputElement>(null);

 useEffect(() => {
 if (isOpen) {
 document.body.style.overflow = "hidden";
 setTimeout(() => inputRef.current?.focus(), 100);
 } else {
 document.body.style.overflow = "";
 }
 return () => {
 document.body.style.overflow = "";
 };
 }, [isOpen]);

 if (!isOpen) return null;

 return (
 <div
 className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
 onClick={onCancel}
 >
 <div
 className="relative bg-[var(--surface)] rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in slide-in-from-top-4 duration-200"
 onClick={(e) => e.stopPropagation()}
 >
 <button
 onClick={onCancel}
 className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-slate-600 dark:text-slate-300 transition"
 aria-label="Close"
 >
 <X className="w-5 h-5" />
 </button>
 <h3 className="text-xl font-bold text-[var(--text)] mb-2">
 {title}
 </h3>
 <p className="text-sm text-[var(--text-muted)] mb-6">
 {message}
 </p>
 <input
 ref={inputRef}
 type="text"
 value={value}
 onChange={(e) => setValue(e.target.value)}
 placeholder={placeholder}
 className="w-full px-4 py-2 border border-slate-300 rounded-2xl mb-6 bg-white text-[var(--text)] focus:ring-2 focus:ring-[var(--lime)]/30 outline-none"
 onKeyDown={(e) => {
 if (e.key === "Enter") onConfirm(value);
 if (e.key === "Escape") onCancel();
 }}
 />
 <div className="flex gap-3 justify-end">
 <button
 onClick={onCancel}
 className="px-4 py-2 bg-slate-100 text-[var(--text-muted)] rounded-2xl text-sm font-bold hover:bg-slate-200 dark:bg-slate-700 transition"
 >
 Cancel
 </button>
 <button
 onClick={() => onConfirm(value)}
 className="px-5 py-2 bg-[var(--lime)] text-black hover:brightness-110 text-white rounded-2xl text-sm font-bold transition"
 >
 {confirmText}
 </button>
 </div>
 </div>
 </div>
 );
}
