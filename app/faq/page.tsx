'use client';
import { useState } from 'react';
import Link from 'next/link';

const faqs = {
  individual: [
    { q: 'How many photos should I upload?', a: 'We recommend 10-20 clear selfies for best results.' },
    { q: 'What if I don’t like my headshots?', a: '100% money-back guarantee within 14 days.' },
    { q: 'How fast will I get my headshots?', a: 'Basic: 2 hours, Pro: 1 hour, Executive: 30 minutes.' }
  ],
  free: [
    { q: 'Do I need to sign up?', a: 'No, the free generator requires no account.' },
    { q: 'Can I download all 9 styles for free?', a: 'Only one HD image is free. Unlock all with a paid plan.' }
  ],
  team: [
    { q: 'How does team pricing work?', a: 'Volume discounts apply. Contact us for a quote.' },
    { q: 'Can I manage multiple employees?', a: 'Yes, admin dashboard with invites and progress tracking.' }
  ]
};

export default function FAQPage() {
  const [open, setOpen] = useState<{ [key: string]: boolean }>({});
  const toggle = (key: string) => setOpen(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div style={{ minHeight: '100vh', background: '#faf7f2', fontFamily: 'DM Sans, sans-serif', padding: '2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.5rem', textAlign: 'center' }}>Frequently Asked Questions</h1>
        {Object.entries(faqs).map(([section, items]) => (
          <div key={section} style={{ marginTop: '2rem' }}>
            <h2 style={{ textTransform: 'capitalize', borderBottom: '2px solid #c9a84c', display: 'inline-block' }}>{section}</h2>
            {items.map((faq, idx) => {
              const key = `${section}-${idx}`;
              return (
                <div key={key} style={{ borderBottom: '1px solid #ddd', marginTop: '1rem' }}>
                  <div onClick={() => toggle(key)} style={{ cursor: 'pointer', fontWeight: 'bold', padding: '0.5rem 0' }}>{faq.q}</div>
                  {open[key] && <div style={{ padding: '0 0 1rem 0', color: '#4a5568' }}>{faq.a}</div>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
