'use client';

import Link from 'next/link';
import { CheckCircle, ArrowRight, Camera, Zap, Shield, Star, Users, Clock, ChevronRight, Menu, X, TrendingDown, Award } from 'lucide-react';
import { useState } from 'react';
import { PLANS, HEADSHOT_CATEGORIES } from '@/lib/plans';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const plans = Object.values(PLANS);
  const avgPhotographerCost = 232;
  const savings = ((avgPhotographerCost - PLANS.basic.price) / avgPhotographerCost * 100).toFixed(0);

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
            <a href="#headshot-types" className="hover:text-blue-600 transition">Headshot Types</a>
            <a href="#pricing" className="hover:text-blue-600 transition">Pricing</a>
            <a href="#testimonials" className="hover:text-blue-600 transition">Testimonials</a>
            <Link href="/login" className="text-slate-600 hover:text-blue-600 transition">Sign In</Link>
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
            <a href="#headshot-types" onClick={() => setMobileMenuOpen(false)}>Headshot Types</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
            <Link href="/upload" onClick={() => setMobileMenuOpen(false)} className="bg-slate-900 text-white text-center px-5 py-2 rounded-full text-sm font-semibold">
              Get Started
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section - Emotional Selling */}
      <section className="pt-32 pb-20 px-6 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <TrendingDown size={16} />
          <span>{savings}% cheaper than a traditional photographer</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Your professional headshot, <br />
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">without the studio anxiety.</span>
        </h1>
        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
          No awkward poses, no expensive photographers, no wasted time. Get {PLANS.basic.shots}+ studio-quality headshots delivered in as fast as {PLANS.executive.turnaround}.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/upload" className="bg-blue-600 text-white text-lg px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-lg">
            Create my Headshots <ArrowRight size={20} />
          </Link>
          <a href="#pricing" className="border border-slate-300 text-slate-700 text-lg px-8 py-4 rounded-xl font-semibold hover:bg-slate-50 transition">
            View Pricing
          </a>
        </div>
        <p className="text-sm text-slate-400 mt-6">
          ⭐ Trusted by 5,000+ professionals • 100% satisfaction guarantee
        </p>
      </section>

      {/* Cost Comparison Banner */}
      
      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Why choose Truzot?</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Professional headshots that don't break the bank — or your schedule.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="w-12 h-12 text-blue-600 mb-4">📸</div>
              <h3 className="text-xl font-bold mb-2">Studio Quality</h3>
              <p className="text-slate-600">AI-generated headshots that look like they were taken by a professional photographer.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="w-12 h-12 text-blue-600 mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-2">60-Minute Delivery</h3>
              <p className="text-slate-600">Get your headshots delivered to your inbox in under an hour.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="w-12 h-12 text-blue-600 mb-4">🔒</div>
              <h3 className="text-xl font-bold mb-2">Private & Secure</h3>
              <p className="text-slate-600">Your photos are encrypted and permanently deleted after 30 days.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="w-12 h-12 text-blue-600 mb-4">🎨</div>
              <h3 className="text-xl font-bold mb-2">10+ Styles</h3>
              <p className="text-slate-600">Corporate, creative, casual, and more — all with your face.</p>
            </div>
          </div>
        </div>
      </section>


<section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-12">
        <div className="max-w-4xl mx-auto text-center px-6">
          <div className="flex justify-center gap-12 flex-wrap">
            <div>
              <div className="text-3xl font-bold line-through opacity-75">${avgPhotographerCost}</div>
              <div className="text-sm opacity-75">Traditional Photographer</div>
            </div>
            <div className="text-3xl font-bold">VS</div>
            <div>
              <div className="text-3xl font-bold">${PLANS.basic.price}</div>
              <div className="text-sm opacity-75">Truzot AI Headshots</div>
            </div>
          </div>
          <p className="mt-4 text-blue-100">Save hundreds of dollars and get your photos in hours, not weeks.</p>
        </div>
      </section>

      {/* Headshot Categories Section */}
      <section id="headshot-types" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Headshots for every profession</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Whether you're on LinkedIn, auditioning for a role, or leading a team — we've got you covered.</p>
          </div>
          <div className="grid md:grid-cols-5 gap-6">
            {HEADSHOT_CATEGORIES.map(cat => (
              <div key={cat.id} className="bg-slate-50 p-6 rounded-xl text-center hover:shadow-lg transition">
                <div className="text-4xl mb-3">{cat.icon}</div>
                <h3 className="font-bold">{cat.name}</h3>
                <p className="text-sm text-slate-500 mt-2">{cat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-slate-50 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-slate-600">One-time payment. No subscriptions. Ever.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div key={plan.id} className={`relative bg-white p-8 rounded-2xl border ${plan.popular ? 'border-blue-600 shadow-xl ring-2 ring-blue-50' : 'border-slate-200'} transition hover:shadow-lg`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <div className="mt-4 mb-2">
                  <span className="text-4xl font-black">${plan.price}</span>
                  <span className="text-slate-500"> one-time</span>
                </div>
                <div className="text-sm text-green-600 mb-4">⚡ Ready in {plan.turnaround}</div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2"><CheckCircle size={18} className="text-green-500" /> {plan.shots} AI Headshots</li>
                  <li className="flex items-center gap-2"><CheckCircle size={18} className="text-green-500" /> {plan.styles} Unique Styles</li>
                  <li className="flex items-center gap-2"><CheckCircle size={18} className="text-green-500" /> {plan.resolution}</li>
                  <li className="flex items-center gap-2"><CheckCircle size={18} className="text-green-500" /> Commercial license</li>
                </ul>
                <Link
                  href={`/upload?plan=${plan.id}`}
                  className={`block w-full text-center py-3 rounded-xl font-bold transition ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  Get {plan.name}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-slate-500 mt-8">💳 All plans include a 100% satisfaction guarantee. Pay once, own forever.</p>
        </div>
      
      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-slate-50 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Loved by professionals worldwide</h2>
            <p className="text-slate-600">Join thousands who've upgraded their professional image.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex gap-1 text-yellow-400 mb-4">★★★★★</div>
              <p className="text-slate-700 mb-4">"Got hired after updating my LinkedIn with these headshots. Best $39 I ever spent."</p>
              <div className="font-semibold">Sarah Chen</div>
              <div className="text-sm text-slate-500">Product Manager @ Google</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex gap-1 text-yellow-400 mb-4">★★★★★</div>
              <p className="text-slate-700 mb-4">"The team plan saved us thousands vs. a photo studio. Highly recommend!"</p>
              <div className="font-semibold">Marcus Rodriguez</div>
              <div className="text-sm text-slate-500">Founder @ Startup</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex gap-1 text-yellow-400 mb-4">★★★★★</div>
              <p className="text-slate-700 mb-4">"Finally, professional headshots without the awkward studio session. The AI nailed my likeness."</p>
              <div className="font-semibold">Emily Watson</div>
              <div className="text-sm text-slate-500">Actor</div>
            </div>
          </div>
        </div>
      </section>


</section>

      {/* CTA Banner */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Stop overpaying for headshots.</h2>
          <p className="text-lg text-blue-100 mb-8">Get studio-quality results for 8x less than a photographer.</p>
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
            <p className="text-sm">AI-powered professional headshots without the studio hassle.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/upload" className="hover:text-white">Create Headshots</Link></li>
              <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
              <li><Link href="/login" className="hover:text-white">My Account</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white">About</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
              <li><Link href="/refund" className="hover:text-white">Refund Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-slate-800 mt-8 pt-8 text-center text-sm">
          &copy; 2026 Truzot. Professional headshots, AI-generated.
        </div>
      </footer>
    </div>
  );
}