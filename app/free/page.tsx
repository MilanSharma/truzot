'use client';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import JSZip from 'jszip';

export default function FreeGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [freeDownloadUrl, setFreeDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setResults([]);
      setFreeDownloadUrl(null);
    }
  };

  const generateFree = async () => {
    if (!file) return;
    setGenerating(true);
    setError('');
    try {
      const zip = new JSZip();
      zip.file('selfie.jpg', file);
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const formData = new FormData();
      formData.append('zip', zipBlob, 'selfie.zip');
      formData.append('email', 'free@temporary.com');
      formData.append('plan', 'basic');
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const { zipUrl } = await uploadRes.json();
      // Call a dedicated free generation endpoint (simulate 9 styles)
      const genRes = await fetch('/api/free-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipUrl })
      });
      if (!genRes.ok) throw new Error('Generation failed');
      const data = await genRes.json();
      setResults(data.urls.slice(0, 9));
      setFreeDownloadUrl(data.urls[0]); // first one free
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#faf7f2', fontFamily: 'DM Sans, sans-serif', padding: '2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.5rem', textAlign: 'center' }}>
          Free AI Headshot Generator
        </h1>
        <p style={{ textAlign: 'center', color: '#6b6560', marginBottom: '2rem' }}>
          Upload one selfie – get 9 AI‑generated styles. Download one HD image for free.
        </p>
        <div style={{ border: '2px dashed #ccc', padding: '2rem', textAlign: 'center', borderRadius: '8px', background: '#fff' }}>
          <input type="file" accept="image/*" onChange={handleFile} />
          {preview && <img src={preview} style={{ maxWidth: '200px', marginTop: '1rem', borderRadius: '8px' }} alt="Preview" />}
          {file && !generating && (
            <button onClick={generateFree} style={{ marginTop: '1rem', background: '#0a0a0a', color: '#fff', padding: '0.5rem 1rem', borderRadius: '4px' }}>
              Generate 9 Styles
            </button>
          )}
          {generating && <p>⚙️ Generating...</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {results.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h3>Your free previews (click to download one for free):</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
                {results.map((url, idx) => (
                  <a key={idx} href={url} download={idx === 0 ? `free-headshot.jpg` : undefined} style={{ textAlign: 'center' }}>
                    <img src={url} style={{ width: '100%', borderRadius: '8px' }} alt={`style ${idx+1}`} />
                    {idx === 0 && <span style={{ display: 'block', background: '#10b981', color: '#fff', padding: '2px', marginTop: '4px' }}>FREE DOWNLOAD</span>}
                    {idx > 0 && <span style={{ fontSize: '12px', color: '#6b6560' }}>Unlock with paid plan</span>}
                  </a>
                ))}
              </div>
              <p style={{ marginTop: '1rem' }}>
                <Link href="/upload?plan=basic" style={{ background: '#0a0a0a', color: '#fff', padding: '0.5rem 1rem', borderRadius: '4px', textDecoration: 'none' }}>
                  Unlock all styles + 40 headshots for $29 →
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
