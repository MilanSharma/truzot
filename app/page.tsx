'use client';

import Link from 'next/link';
import { CheckCircle, ArrowRight, Camera, Zap, Shield, Star, Users, Clock, ChevronRight, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const plans = [
    {
      name: 'Basic',
      price: 29,
      shots: 40,
      styles: 10,
      popular: false,
      buttonText: 'Get Basic',
      buttonVariant: 'outline',
      slug: 'basic'
    },
    {
      name: 'Pro',
      price: 99,
      shots: 120,
      styles: 30,
      popular: true,
      buttonText: 'Most Popular',
      buttonVariant: 'primary',
      slug: 'pro'
    },
    {
      name: 'Executive',
      price: 199,
      shots: 200,
      styles: 'All',
      popular: false,
      buttonText: 'Get Executive',
      buttonVariant: 'outline',
      slug: 'executive'
    }
  ];

  const features = [
    { icon: Camera, title: 'Studio Quality', description: 'AI-generated headshots that look like they were taken by a professional photographer.' },
    { icon: Zap, title: '60-Minute Delivery', description: 'Get your headshots delivered to your inbox in under an hour.' },
    { icon: Shield, title: 'Private & Secure', description: 'Your photos are encrypted and permanently deleted after 30 days.' },
    { icon: Users, title: '10+ Styles', description: 'Choose from corporate, creative, casual, and more — all with your face.' }
  ];

  const testimonials = [
    { name: 'Sarah Chen', role: 'Product Manager @ Google', content: 'Got hired after updating my LinkedIn with these headshots. Best $99 I ever spent.', rating: 5 },
    { name: 'Marcus Rodriguez', role: 'Founder @ Startup', content: 'The team plan saved us thousands vs. a photo studio. Highly recommend!', rating: 5 },
    { name: 'Emily Watson', role: 'Actor', content: 'Finally, professional headshots without the awkward studio session. The AI nailed my likeness.', rating: 5 }
  ];

  const faqs = [
    { q: 'How many photos do I need to upload?', a: 'We recommend 10–20 clear selfies with different angles, lighting, and expressions. More variety = better results.' },
    { q: 'What if I don't like the headshots?', a: 'We offer a 100% satisfaction guarantee. If you're not happy, we'll refund your purchase — no questions asked.' },
    { q: 'How long does it take?', a: 'Training takes ~30 minutes, generating another 15–30 minutes. Most orders are delivered within 60 minutes.' },
    { q: 'Is my data safe?', a: 'Yes. Your photos are encrypted in transit and at rest. We automatically delete everything after 30 days.' }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold tracking-tighter bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            TRUZOT
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="hover:text-blue-600 transition">Features</a>
            <a href="#pricing" className="hover:text-blue-600 transition">Pricing</a>
            <a href="#testimonials" className="hover:text-blue-600 transition">Testimonials</a>
            <a href="#faq" className="hover:text-blue-600 transition">FAQ</a>
            <Link href="/upload" className="bg-slate-900 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-blue-600 transition">
              Get Started
            </Link>
          </div>

          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-100 py-4 px-6 flex flex-col gap-4">
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <a href="#testimonials" onClick={() => setMobileMenuOpen(false)}>Testimonials</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
            <Link href="/upload" onClick={() => setMobileMenuOpen(false)} className="bg-slate-900 text-white text-center px-5 py-2 rounded-full text-sm font-semibold">
              Get Started
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Star size={16} fill="currentColor" />
          <span>Trusted by 5,000+ professionals</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Your professional headshot, <br />
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">powered by AI.</span>
        </h1>
        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
          Get 40+ studio-quality headshots in 60 minutes. No photographer, no studio, just $29.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/upload" className="bg-blue-600 text-white text-lg px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-lg">
            Create my Headshots <ArrowRight size={20} />
          </Link>
          <a href="#features" className="border border-slate-300 text-slate-700 text-lg px-8 py-4 rounded-xl font-semibold hover:bg-slate-50 transition">
            How it works
          </a>
        </div>
        <p className="text-sm text-slate-400 mt-6">
          🔒 No credit card required to preview • 100% satisfaction guarantee
        </p>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-50 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Why choose Truzot?</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Professional headshots that don't break the bank — or your schedule.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <feature.icon className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-slate-600">Choose the pack that fits your career goals.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div key={plan.name} className={`relative bg-white p-8 rounded-2xl border ${plan.popular ? 'border-blue-600 shadow-xl ring-2 ring-blue-50' : 'border-slate-200'} transition hover:shadow-lg`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold mt-4">{plan.name}</h3>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-black">${plan.price}</span>
                  <span className="text-slate-500"> / one-time</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2"><CheckCircle size={18} className="text-green-500" /> {plan.shots} AI Headshots</li>
                  <li className="flex items-center gap-2"><CheckCircle size={18} className="text-green-500" /> {plan.styles} Unique Styles</li>
                  <li className="flex items-center gap-2"><CheckCircle size={18} className="text-green-500" /> 60-min delivery</li>
                  <li className="flex items-center gap-2"><CheckCircle size={18} className="text-green-500" /> Commercial license</li>
                </ul>
                <Link
                  href={`/upload?plan=${plan.slug}`}
                  className={`block w-full text-center py-3 rounded-xl font-bold transition ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {plan.buttonText}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-slate-500 mt-8">All plans include a 100% satisfaction guarantee. No subscription, pay once.</p>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-slate-50 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Loved by professionals worldwide</h2>
            <p className="text-slate-600">Join thousands who've upgraded their professional image.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex gap-1 text-yellow-400 mb-4">
                  {[...Array(t.rating)].map((_, j) => <Star key={j} size={18} fill="currentColor" />)}
                </div>
                <p className="text-slate-700 mb-4">"{t.content}"</p>
                <div className="font-semibold">{t.name}</div>
                <div className="text-sm text-slate-500">{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Frequently asked questions</h2>
            <p className="text-slate-600">Everything you need to know about Truzot.</p>
          </div>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-slate-200 pb-6">
                <h3 className="text-xl font-semibold mb-2">{faq.q}</h3>
                <p className="text-slate-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to upgrade your professional image?</h2>
          <p className="text-lg text-blue-100 mb-8">Get studio-quality headshots without the studio prices.</p>
          <Link href="/upload" className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg transition">
            Get Started Now <ChevronRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="text-2xl font-bold text-white mb-4">TRUZOT</div>
            <p className="text-sm">AI-powered professional headshots.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/upload" className="hover:text-white">Create Headshots</Link></li>
              <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
              <li><a href="#features" className="hover:text-white">Features</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">About</a></li>
              <li><a href="#" className="hover:text-white">Blog</a></li>
              <li><a href="#" className="hover:text-white">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Privacy</a></li>
              <li><a href="#" className="hover:text-white">Terms</a></li>
              <li><a href="#" className="hover:text-white">Refund Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-slate-800 mt-8 pt-8 text-center text-sm">
          &copy; 2026 Truzot. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
