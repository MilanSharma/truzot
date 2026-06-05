'use client';
import { useState, useCallback, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import JSZip from 'jszip';
import { supabase } from '@/lib/supabase/client';
import { Camera, Upload, Shield, Zap, Check, X, ChevronRight, Star, Lock, Image as ImageIcon } from 'lucide-react';

const PLANS = [
  { id: 'basic', label: 'Basic', price: 29, shots: 40, time: '2 hours', popular: false },
  { id: 'pro', label: 'Professional', price: 39, shots: 100, time: '1 hour', popular: true },
  { id: 'executive', label: 'Executive', price: 59, shots: 200, time: '30 min', popular: false },
];

const PHOTO_TIPS = [
  { icon: '😊', text: 'Clear face shots', desc: 'Your face should be clearly visible' },
  { icon: '💡', text: 'Good lighting', desc: 'Natural or well-lit photos work best' },
  { icon: '📐', text: 'Different angles', desc: 'Front, side, and 3/4 views' },
  { icon: '👔', text: 'Various outfits', desc: 'Casual and professional clothes' },
];

type Stage = 'upload' | 'details' | 'processing';

function UploadContent() {
  const searchParams = useSearchParams();
  const [files, setFiles] = useState<File[]>([]);
  const [plan, setPlan] = useState(searchParams.get('plan') ?? 'pro');
  const [email, setEmail] = useState('');
  const [stage, setStage] = useState<Stage>('upload');
  const [userId, setUserId] = useState<string | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        setEmail(session.user.email ?? '');
      }
    };
    loadUser();
  }, []);
  const selectedPlan = PLANS.find(p => p.id === plan) || PLANS[1];
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [uploadedCount, setUploadedCount] = useState(0);

  const handleFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const valid = Array.from(incoming).filter((f) => f.type.startsWith('image/') && f.size < 10 * 1024 * 1024);
    setFiles((prev) => {
      const combined = [...prev, ...valid];
      setUploadedCount(combined.length);
      return combined.slice(0, 20);
    });
  }, []);

  const removeFile = (i: number) => {
    setFiles((f) => {
      const updated = f.filter((_, idx) => idx !== i);
      setUploadedCount(updated.length);
      return updated;
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); 
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleSubmit = async () => {
    setError('');
    if (!consentChecked) { setError('Please accept the biometric processing consent check before proceeding.'); return; }
    if (!email || !email.includes('@')) { setError('Please enter a valid email address.'); return; }
    if (files.length < 1) { setError('Please upload at least 1 photo.'); return; }
    
    setStage('processing');
    try {
      setProgress('Compressing your photos…');
      const zip = new JSZip();
      files.forEach((f, i) => {
        const ext = f.name.split('.').pop() ?? 'jpg';
        zip.file(`photo_${i + 1}.${ext}`, f);
      });
      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
      
      setProgress('Preparing secure upload...');
      // 1. Get signed upload URL from backend
      const uploadUrlRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-upload-url', filename: `selfies_${Date.now()}.zip` })
      });
      if (!uploadUrlRes.ok) {
        const err = await uploadUrlRes.json();
        throw new Error(err.error ?? 'Failed to get upload URL');
      }
      const { signedUrl, token, path } = await uploadUrlRes.json();

      setProgress('Uploading your photos securely…');
      
      // Upload using promise-wrapped XMLHttpRequest to output numeric progress feedback
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', signedUrl);
        xhr.setRequestHeader('x-upsert', 'true');
        xhr.setRequestHeader('content-type', 'application/zip');
        if (token) {
          xhr.setRequestHeader('authorization', `Bearer ${token}`);
        }
        
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setProgress(`Uploading selfies: ${pct}%`);
          }
        };
        
        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 201 || xhr.status === 204) {
            resolve();
          } else {
            reject(new Error('File upload failed. Please try again.'));
          }
        };
        
        xhr.onerror = () => reject(new Error('Network error during upload. Please check your connection.'));
        xhr.send(zipBlob);
      });

      setProgress('Finalizing upload...');
      // 3. Get the download URL for the checkout session
      const downloadUrlRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-download-url', path })
      });
      if (!downloadUrlRes.ok) {
        const err = await downloadUrlRes.json();
        throw new Error(err.error ?? 'Failed to finalize upload');
      }
      const { zipUrl } = await downloadUrlRes.json();
      
      setProgress('Redirecting to secure checkout…');
      // 4. Create Stripe checkout session
      const checkoutRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, email, zipUrl, userId }), // Pass user ID to secure order linking
      });
      if (!checkoutRes.ok) {
        const err = await checkoutRes.json();
        throw new Error(err.error ?? 'Checkout failed');
      }
      const { url } = await checkoutRes.json();
      
      window.location.href = url;
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message ?? 'Something went wrong. Please try again.');
      setStage('upload');
    }
  };

    return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tighter bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            TRUZOT
          </Link>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Lock className="w-4 h-4" />
            <span>Secure & Private</span>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Star className="w-4 h-4" />
            <span>Trusted by 5,000+ professionals</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Professional Headshots in Minutes
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Upload just <span className="font-bold text-blue-600">1-3 photos</span> and get {selectedPlan.shots} AI-generated headshots for just <span className="font-bold text-blue-600">${selectedPlan.price}</span>
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Left Column - Upload Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Zone */}
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                id="file-input"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <label htmlFor="file-input" className="cursor-pointer block">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {files.length === 0 ? 'Drop your photos here' : `${files.length} photo${files.length !== 1 ? 's' : ''} uploaded`}
                </h3>
                <p className="text-slate-600 mb-4">
                  {files.length === 0 ? 'or click to browse' : 'Add more photos for better results'}
                </p>
                <p className="text-sm text-slate-500">
                  JPG, PNG • Max 10MB each • Up to 20 photos
                </p>
              </label>
            </div>

            {/* Photo Tips */}
            {files.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-blue-600" />
                  What photos work best?
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {PHOTO_TIPS.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="text-2xl">{tip.icon}</span>
                      <div>
                        <div className="font-semibold text-slate-900">{tip.text}</div>
                        <div className="text-sm text-slate-600">{tip.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Pro tip:</strong> Even 1-3 good photos are enough! More photos = better variety in your headshots.
                  </p>
                </div>
              </div>
            )}

            {/* File Previews */}
            {files.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="font-bold text-slate-900 mb-4">Your Photos ({files.length})</h3>
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                  {files.map((f, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 group">
                      <img 
                        src={URL.createObjectURL(f)} 
                        alt="" 
                        className="w-full h-full object-cover" 
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <label htmlFor="file-input-add" className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      id="file-input-add"
                      onChange={(e) => handleFiles(e.target.files)}
                    />
                    <Upload className="w-6 h-6 text-slate-400" />
                  </label>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Right Column - Plan Selection & Checkout */}
          <div className="space-y-6">
            {/* Plan Selection */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-24">
              <h3 className="font-bold text-slate-900 mb-4 text-lg">Choose Your Plan</h3>
              <div className="space-y-3 mb-6">
                {PLANS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlan(p.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      plan === p.id 
                        ? 'border-blue-600 bg-blue-50' 
                        : 'border-slate-200 hover:border-slate-300'
                    } ${p.popular ? 'relative' : ''}`}
                  >
                    {p.popular && (
                      <div className="absolute -top-3 right-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        MOST POPULAR
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900">{p.label}</span>
                      <span className="text-2xl font-bold text-blue-600">${p.price}</span>
                    </div>
                    <div className="text-sm text-slate-600">
                      {p.shots} headshots • Ready in {p.time}
                    </div>
                  </button>
                ))}
              </div>

              {/* Email Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
                <p className="text-xs text-slate-500 mt-1">
                  We'll send your headshots here
                </p>
              </div>

              {/* Biometric consent checkbox (GDPR/CCPA compliance requirement) */}
              <div className="flex items-start gap-3 mt-4 mb-6">
                <input
                  type="checkbox"
                  id="biometric-consent"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <label htmlFor="biometric-consent" className="text-xs text-slate-500 leading-relaxed select-none">
                  I consent to Truzot processing my biometric face photos to train an AI model, and agree to the 30-day automatic deletion policy in accordance with the{' '}
                  <Link href="/privacy" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </label>
              </div>

              {/* Submit Button */}
              {stage === 'processing' ? (
                <div className="bg-slate-100 rounded-xl p-6 text-center">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <div className="font-semibold text-slate-900 mb-1">{progress}</div>
                  <div className="text-sm text-slate-600">Please don't close this tab</div>
                </div>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={files.length === 0 || !consentChecked}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Continue to Payment
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t border-slate-200 space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span>100% satisfaction guarantee</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Lock className="w-5 h-5 text-green-600" />
                  <span>Bank-level encryption</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Zap className="w-5 h-5 text-green-600" />
                  <span>Photos deleted after 30 days</span>
                </div>
              </div>

              {/* Price Comparison */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <div className="text-center">
                  <div className="text-sm text-slate-600 mb-1">Traditional photographer</div>
                  <div className="text-2xl font-bold text-slate-400 line-through">$200-500</div>
                  <div className="text-sm text-slate-600 mt-3 mb-1">Truzot AI</div>
                  <div className="text-3xl font-bold text-blue-600">${selectedPlan.price}</div>
                  <div className="text-sm text-green-600 font-semibold mt-2">
                    Save {(1 - selectedPlan.price / 300) * 100 | 0}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-12">
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-8">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">1. Upload Photos</h3>
              <p className="text-slate-600 text-sm">Upload 1-20 photos of yourself. The more variety, the better!</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">2. AI Generates</h3>
              <p className="text-slate-600 text-sm">Our AI creates {selectedPlan.shots} professional headshots in {selectedPlan.time}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">3. Download</h3>
              <p className="text-slate-600 text-sm">Receive your headshots via email and download instantly</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="text-center">
          <p className="text-slate-600 mb-4">Have questions?</p>
          <Link href="/faq" className="text-blue-600 font-semibold hover:underline">
            Visit our FAQ →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense>
      <UploadContent />
    </Suspense>
  );
}
