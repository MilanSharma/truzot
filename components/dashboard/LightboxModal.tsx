"use client";
import { useEffect } from "react";
import Image from "next/image";
import { Heart, Download, X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ShareButton from "@/components/ShareButton";

interface LightboxModalProps {
  imageUrl: string;
  allImages?: string[];
  favorites: string[];
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onToggleFavorite: (url: string, e?: React.MouseEvent) => void;
  onDownload: (url: string) => void;
}

export default function LightboxModal({
  imageUrl,
  allImages,
  favorites,
  onClose,
  onPrev,
  onNext,
  onToggleFavorite,
  onDownload,
}: LightboxModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && onPrev) onPrev();
      if (e.key === "ArrowRight" && onNext) onNext();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, onPrev, onNext]);

  return (
    <motion.div
      className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="relative max-w-5xl w-full h-full flex flex-col justify-center items-center"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {allImages && allImages.length > 1 && (
          <div className="text-white/60 text-xs font-bold tracking-wide uppercase absolute top-6 left-1/2 -translate-x-1/2 z-20 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
            {allImages.indexOf(imageUrl) + 1} / {allImages.length}
          </div>
        )}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3 text-white">
            <span className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase border border-white/10">
              Preview Mode
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => onToggleFavorite(imageUrl, e)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition border ${favorites.includes(imageUrl) ? "bg-rose-500 border-rose-400 text-white" : "bg-white/10 hover:bg-white/20 border-white/10 text-white"}`}
            >
              <Heart
                className={`w-5 h-5 ${favorites.includes(imageUrl) ? "fill-white" : ""}`}
              />
            </button>
            <div className="hidden sm:block">
              <ShareButton imageUrl={imageUrl} label="Share" />
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload(imageUrl);
              }}
              className="w-12 h-12 rounded-xl bg-white text-slate-900 flex items-center justify-center hover:bg-slate-100 transition shadow-xl"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        {onPrev && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-md border border-white/10 text-white flex items-center justify-center transition z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {onNext && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-md border border-white/10 text-white flex items-center justify-center transition z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
        <div className="relative max-h-[85vh] max-w-full w-full h-full">
          <div className="absolute inset-0 bg-slate-700/50 rounded-2xl animate-pulse" />
          <Image
            src={imageUrl}
            alt="HD Headshot preview"
            fill
            sizes="90vw"
            className="object-contain rounded-2xl shadow-2xl border-4 border-white/10"
            onLoad={(e) => {
              const target = e.target as HTMLImageElement;
              target.previousElementSibling?.classList.add("hidden");
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
