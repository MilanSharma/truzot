"use client";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import {
  Heart,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Linkedin,
  Keyboard,
} from "lucide-react";
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
  const [showHints, setShowHints] = useState(false);
  const callbacksRef = useRef({ onClose, onPrev, onNext, onDownload, onToggleFavorite, imageUrl });

  useEffect(() => {
    callbacksRef.current = { onClose, onPrev, onNext, onDownload, onToggleFavorite, imageUrl };
  });

  useEffect(() => {
    // Show hints briefly on first open
    const t = setTimeout(() => setShowHints(true), 0);
    const t2 = setTimeout(() => setShowHints(false), 4000);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      const { onClose, onPrev, onNext, onDownload, onToggleFavorite, imageUrl } = callbacksRef.current;

      if (e.key === "Escape") onClose();
      if (!isInput) {
        if (e.key === "ArrowLeft" && onPrev) onPrev();
        if (e.key === "ArrowRight" && onNext) onNext();
        if (e.key.toLowerCase() === "d") onDownload(imageUrl);
        if (e.key.toLowerCase() === "f") onToggleFavorite(imageUrl);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const downloadForLinkedIn = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      // Use direct URL since image-proxy route was deleted
      img.src = imageUrl;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const size = Math.min(img.width, img.height);
          const sx = (img.width - size) / 2;
          const sy = (img.height - size) / 2;
          ctx.drawImage(img, sx, sy, size, size, 0, 0, 400, 400);
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              try {
                const a = document.createElement("a");
                a.href = url;
                a.download = "linkedin-optimized-headshot.jpg";
                a.click();
              } finally {
                URL.revokeObjectURL(url);
              }
            }
          }, "image/jpeg", 0.95);
        }
      };
    } catch (err) {
      onDownload(imageUrl); // Fallback to standard download
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-[#07080A]/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4"
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
          <div className="text-white/50 text-xs font-bold tracking-wide uppercase absolute top-6 left-1/2 -translate-x-1/2 z-20 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
            {allImages.indexOf(imageUrl) + 1} / {allImages.length}
          </div>
        )}

        {/* Top Bar */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition"
              aria-label="Close lightbox"
            >
              <X className="w-6 h-6" />
            </button>
            <AnimatePresence>
              {showHints && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="hidden md:flex items-center gap-2 text-xs text-white/50 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>← → Navigate</span> • <span>D Download</span> • <span>F Favorite</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={downloadForLinkedIn}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A66C2] text-white hover:bg-[#004182] transition shadow-lg text-sm font-bold"
            >
              <Linkedin className="w-4 h-4" /> Optimized for LinkedIn
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload(imageUrl);
              }}
              className="w-12 h-12 rounded-xl bg-lime-400 text-black flex items-center justify-center hover:bg-lime-300 transition shadow-lg shadow-lime-400/20"
              aria-label="Download original"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Arrows */}
        {onPrev && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-md border border-white/10 text-white flex items-center justify-center transition z-20"
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
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-md border border-white/10 text-white flex items-center justify-center transition z-20"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Image Display */}
        <div className="relative max-h-[80vh] max-w-full w-full h-full flex items-center justify-center">
          <div className="absolute inset-0 bg-white/5 rounded-2xl animate-pulse max-w-2xl mx-auto" />
          <Image
            src={imageUrl}
            alt="HD Headshot preview"
            fill
            sizes="90vw"
            className="object-contain rounded-2xl shadow-2xl z-10"
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