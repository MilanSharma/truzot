'use client';
import { useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import JSZip from 'jszip';
import { supabase } from '@/lib/supabase/client';

const PLANS = [
  { id: 'basic',     label: 'Basic',     price: '$29',  shots: '40',   time: '60 min' },
  { id: 'pro',       label: 'Pro',       price: '$99',  shots: '120',  time: '45 min' },
  { id: 'executive', label: 'Executive', price: '$199', shots: '200+', time: '30 min' },
];

type Stage = 'upload' | 'details' | 'processing';

function UploadContent() {
  const searchParams = useSearchParams();
  const [files, setFiles] = useState<File[]>([]);
  const [plan, setPlan] = useState(searchParams.get('plan') ?? 'pro');
  const [email, setEmail] = useState('');
  const [stage, setStage] = useState<Stage>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');

  const handleFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const valid = Array.from(incoming).filter((f) => f.type.startsWith('image/') && f.size < 10 * 1024 * 1024);
    setFiles((prev) => {
      const combined = [...prev, ...valid];
      return combined.slice(0, 25);
    });
  }, []);

  const removeFile = (i: number) => setFiles((f) => f.filter((_, idx) => idx !== i));

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleSubmit = async () => {
    setError('');
    if (!email || !email.includes('@')) { setError('Please enter a valid email address.'); return; }
    if (files.length < 5) { setError('Please upload at least 5 photos.'); return; }

    setStage('processing');
    try {
      setProgress('Compressing your photos…');
      const zip = new JSZip();
      files.forEach((f, i) => {
        const ext = f.name.split('.').pop() ?? 'jpg';
        zip.file(`photo_${i + 1}.${ext}`, f);
      });
      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });

      setProgress('Uploading your photos securely…');
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.zip`;

      // 1. Get signed upload URL from API
      const uploadUrlRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-upload-url', filename }),
      });
      if (!uploadUrlRes.ok) throw new Error('Failed to get secure upload channel.');
      const { token, path } = await uploadUrlRes.json();

      // 2. Upload file directly to Supabase Storage bypassing Vercel limit
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .uploadToSignedUrl(path, token, zipBlob, { contentType: 'application/zip' });

      if (uploadError) {
        console.error('Direct upload error:', uploadError);
        throw new Error('Secure upload failed. Please try again.');
      }

      // 3. Get signed download URL for Fal.ai
      const downloadUrlRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-download-url', path }),
      });
      if (!downloadUrlRes.ok) throw new Error('Failed to lock secure asset.');
      const { zipUrl } = await downloadUrlRes.json();

      setProgress('Redirecting to checkout…');
      const checkoutRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, email, zipUrl }),
      });
      if (!checkoutRes.ok) {
        const err = await checkoutRes.json();
        throw new Error(err.error ?? 'Checkout failed');
      }
      const { url } = await checkoutRes.json();
      window.location.href = url;
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.');
      setStage('details');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#faf7f2', fontFamily: 'DM Sans, sans-serif', color: '#0a0a0a' }}>
      <nav style={{ padding: '1.25rem 4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(10,10,10,0.08)' }}>
        <Link href="/" style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 900, color: '#0a0a0a', textDecoration: 'none', letterSpacing: '-0.02em' }}>
          Tru<span style={{ color: '#c9a84c' }}>zot</span>
        </Link>
        <div style={{ fontSize: '0.825rem', color: '#6b6560' }}>🔒 Secure · Private · Encrypted</div>
      </nav>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c9a84c' }}>Step 1 of 2</div>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Upload your selfies</h1>
        <p style={{ fontSize: '1rem', color: '#6b6560', fontWeight: 300, lineHeight: 1.6, marginBottom: '2.5rem' }}>
          Upload 10–20 clear photos of your face. Phone selfies work perfectly. Different angles and lighting give better results.
        </p>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          style={{
            border: `2px dashed ${dragOver ? '#c9a84c' : 'rgba(10,10,10,0.2)'}`,
            borderRadius: '4px', padding: '3rem 2rem', textAlign: 'center',
            background: dragOver ? 'rgba(201,168,76,0.04)' : '#ede8df',
            transition: 'all 0.2s', marginBottom: '1.5rem', cursor: 'pointer',
          }}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📸</div>
          <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Drop photos here or click to browse</div>
          <div style={{ fontSize: '0.825rem', color: '#6b6560', fontWeight: 300 }}>JPG or PNG · Max 10MB each · Up to 25 photos</div>
          <input id="file-input" type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFiles(e.target.files)} />
        </div>

        {files.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px', marginBottom: '2rem' }}>
            {files.map((f, i) => (
              <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: '4px', overflow: 'hidden', background: '#d4c9b8' }}>
                <img src={URL.createObjectURL(f)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} style={{
                  position: 'absolute', top: '4px', right: '4px',
                  background: 'rgba(10,10,10,0.7)', color: '#fff',
                  border: 'none', borderRadius: '50%', width: '20px', height: '20px',
                  fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>✕</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ fontSize: '0.825rem', color: files.length >= 10 ? '#1a6e3a' : '#6b6560', fontWeight: 500, marginBottom: '2rem' }}>
          {files.length === 0 ? 'No photos yet — upload at least 10 for best results' : `${files.length} photo${files.length !== 1 ? 's' : ''} selected ${files.length >= 10 ? '✓ Good to go!' : `— ${10 - files.length} more recommended`}`}
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontWeight: 500, marginBottom: '1rem' }}>Choose your plan</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {PLANS.map((p) => (
              <button key={p.id} onClick={() => setPlan(p.id)} style={{
                padding: '1.25rem 1rem', border: `1px solid ${plan === p.id ? '#0a0a0a' : 'rgba(10,10,10,0.15)'}`,
                borderRadius: '2px', background: plan === p.id ? '#0a0a0a' : 'transparent',
                color: plan === p.id ? '#f5f0e8' : '#0a0a0a',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
              }}>
                <div style={{ fontWeight: 600, marginBottom: '2px' }}>{p.label}</div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 700, marginBottom: '2px' }}>{p.price}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{p.shots} shots · {p.time}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem', fontSize: '0.875rem' }}>Email address — we'll send your headshots here</label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{
              width: '100%', padding: '0.875rem 1rem',
              border: '1px solid rgba(10,10,10,0.2)', borderRadius: '2px',
              fontSize: '1rem', background: '#ede8df', color: '#0a0a0a',
              outline: 'none', fontFamily: 'DM Sans, sans-serif',
            }}
          />
        </div>

        {error && (
          <div style={{ background: '#fdf2f2', border: '1px solid #fca5a5', borderRadius: '2px', padding: '0.875rem 1rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: '#b91c1c' }}>
            {error}
          </div>
        )}

        {stage === 'processing' ? (
          <div style={{ padding: '2rem', textAlign: 'center', background: '#ede8df', borderRadius: '4px' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '1rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚙️</div>
            <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{progress}</div>
            <div style={{ fontSize: '0.825rem', color: '#6b6560' }}>Please don't close this tab</div>
          </div>
        ) : (
          <button onClick={handleSubmit} style={{
            width: '100%', padding: '1rem', background: '#0a0a0a',
            color: '#f5f0e8', border: 'none', borderRadius: '2px',
            fontSize: '1rem', fontWeight: 500, cursor: 'pointer',
          }}>
            Continue to payment →
          </button>
        )}

        <p style={{ fontSize: '0.775rem', color: '#6b6560', textAlign: 'center', marginTop: '1.25rem', lineHeight: 1.6 }}>
          🔒 Your photos are encrypted in transit and at rest. Permanently deleted after 30 days. We never share or sell your data.
        </p>
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
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
