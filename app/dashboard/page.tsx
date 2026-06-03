'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Upload, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: any) => {
    setUploading(true);
    // 1. Upload files to Supabase Storage
    // 2. Create Stripe Checkout Session
    // 3. Redirect to Stripe
    alert("In production, this triggers Stripe payment.");
    setUploading(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-20 px-6">
      <h1 className="text-3xl font-bold mb-2">Create Your Headshots</h1>
      <p className="text-slate-500 mb-10">Upload 10-15 clear selfies to begin.</p>
      
      <div className="border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center bg-slate-50">
        <Upload className="mx-auto mb-4 text-slate-400" size={48} />
        <input 
          type="file" 
          multiple 
          onChange={handleUpload}
          className="hidden" 
          id="file-upload" 
        />
        <label 
          htmlFor="file-upload"
          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold cursor-pointer hover:bg-blue-700 transition"
        >
          {uploading ? <Loader2 className="animate-spin inline mr-2" /> : "Select Photos"}
        </label>
        <p className="mt-4 text-sm text-slate-400">JPG or PNG. Max 5MB each.</p>
      </div>
    </div>
  );
}