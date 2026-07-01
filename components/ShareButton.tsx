"use client";
import { useState } from "react";
import { Share2, Linkedin, Check, Download } from "lucide-react";

interface ShareButtonProps {
 imageUrl: string;
 label?: string;
}

export default function ShareButton({
 imageUrl,
 label = "Share",
}: ShareButtonProps) {
 const [copied, setCopied] = useState(false);

 const shareLinkedIn = () => {
 const text = encodeURIComponent(
 "Check out my AI-generated professional headshot!",
 );
 window.open(
 `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(imageUrl)}&text=${text}`,
 "_blank",
 "width=600,height=600",
 );
 };

 const downloadForSocial = async () => {
 const res = await fetch(imageUrl);
 const blob = await res.blob();
 const canvas = document.createElement("canvas");
 const img = new Image();
 img.onload = () => {
 const size = 1200;
 canvas.width = size;
 canvas.height = size;
 const ctx = canvas.getContext("2d")!;
 ctx.fillStyle = "#f8fafc";
 ctx.fillRect(0, 0, size, size);
 const margin = 100;
 const imgSize = size - margin * 2;
 ctx.drawImage(img, margin, margin, imgSize, imgSize);
 // Add watermark
 ctx.fillStyle = "rgba(0,0,0,0.06)";
 ctx.font = "14px sans-serif";
 ctx.textAlign = "center";
 ctx.fillText("truzot.com", size / 2, size - 30);
 canvas.toBlob(
 (b) => {
 if (!b) return;
 const url = URL.createObjectURL(b);
 const a = document.createElement("a");
 a.href = url;
 a.download = "truzot-headshot-linkedin.jpg";
 a.click();
 URL.revokeObjectURL(url);
 },
 "image/jpeg",
 0.92,
 );
 };
 img.src = imageUrl;
 };

 const copyLink = () => {
 navigator.clipboard.writeText(imageUrl);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 };

 return (
 <div className="flex items-center gap-2">
 <button
 onClick={shareLinkedIn}
 className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A66C2] text-white rounded-lg text-xs font-bold hover:bg-[#004182] transition"
 title="Share on LinkedIn"
 >
 <Linkedin className="w-3.5 h-3.5" /> LinkedIn
 </button>
 <button
 onClick={downloadForSocial}
 className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition"
 title="Download optimized for social media"
 >
 <Download className="w-3.5 h-3.5" /> Social
 </button>
 <button
 onClick={copyLink}
 className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700 rounded-lg text-xs font-bold border border-slate-200 hover:bg-[var(--bg)] transition"
 >
 {copied ? (
 <Check className="w-3.5 h-3.5 text-green-500" />
 ) : (
 <Share2 className="w-3.5 h-3.5" />
 )}
 {copied ? "Copied" : label}
 </button>
 </div>
 );
}
