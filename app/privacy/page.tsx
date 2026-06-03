export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '4rem auto', padding: '0 2rem', fontFamily: 'DM Sans, sans-serif', color: '#0a0a0a' }}>
      <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.5rem', marginBottom: '1.5rem' }}>Privacy Policy</h1>
      <p style={{ lineHeight: 1.8, marginBottom: '1.5rem' }}>At Truzot, your privacy is our top priority. We only collect the photos you explicitly upload to generate your headshots, along with your email address to deliver them.</p>
      <p style={{ lineHeight: 1.8, marginBottom: '1.5rem' }}><strong>Data Retention:</strong> All uploaded photos and generated headshots are permanently and automatically deleted from our servers 30 days after your order is completed.</p>
      <p style={{ lineHeight: 1.8, marginBottom: '1.5rem' }}>We do not sell, share, or use your photos for training our own AI models. Your data is encrypted in transit and at rest.</p>
    </div>
  );
}
