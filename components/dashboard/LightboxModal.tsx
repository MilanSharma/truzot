"use client";
import { Heart, Download, X } from "lucide-react";
import ShareButton from "@/components/ShareButton";

interface LightboxModalProps {
  imageUrl: string;
  favorites: string[];
  onClose: () => void;
  onToggleFavorite: (url: string, e?: React.MouseEvent) => void;
  onDownload: (url: string) => void;
}

export default function LightboxModal({
  imageUrl,
  favorites,
  onClose,
  onToggleFavorite,
  onDownload,
}: LightboxModalProps) {
  return (
    <div
      className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in duration-200"
      onClick={onClose}
    >
      <div className="relative max-w-5xl w-full h-full flex flex-col justify-center items-center">
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
        <div className="relative max-h-[85vh] max-w-full">
          <div className="absolute inset-0 bg-slate-700/50 rounded-2xl animate-pulse" />
          <img
            src={imageUrl}
            alt="HD Headshot preview"
            className="relative max-h-[85vh] max-w-full object-contain rounded-2xl shadow-2xl border-4 border-white/10"
            onLoad={(e) => {
              (e.target as HTMLElement).previousElementSibling?.classList.add(
                "hidden",
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}
