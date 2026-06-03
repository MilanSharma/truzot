import React from 'react';
import { Camera, Zap, CheckCircle, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="text-2xl font-bold tracking-tighter text-blue-600">TRUZOT</div>
        <div className="hidden md:flex space-x-8 font-medium">
          <a href="#how-it-works">How it works</a>
          <a href="#pricing">Pricing</a>
        </div>
        <button className="bg-slate-900 text-white px-6 py-2 rounded-full font-semibold">Get Started</button>
      </nav>

      {/* Hero Section */}
      <header className="px-8 pt-20 pb-32 max-w-5xl mx-auto text-center">
        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight mb-8">
          Your professional headshot, <span className="text-blue-600">powered by AI.</span>
        </h1>
        <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
          Get 40+ studio-quality headshots in 60 minutes. No photographer, no studio, just $29.
        </p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <button className="w-full md:w-auto bg-blue-600 text-white text-lg px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition">
            Create my Headshots <ArrowRight size={20} />
          </button>
          <p className="text-sm text-slate-400 italic">Trusted by pros at Google & Meta</p>
        </div>
      </header>

      {/* Pricing Section */}
      <section id="pricing" className="bg-slate-50 py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-slate-600">Choose the pack that fits your career goals.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Starter", price: "29", shots: "40", styles: "10" },
              { name: "Professional", price: "49", shots: "120", styles: "30", popular: true },
              { name: "Team", price: "199", shots: "Custom", styles: "All" }
            ].map((plan) => (
              <div key={plan.name} className={`bg-white p-8 rounded-2xl border ${plan.popular ? 'border-blue-600 ring-4 ring-blue-50' : 'border-slate-200'}`}>
                {plan.popular && <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">Most Popular</span>}
                <h3 className="text-2xl font-bold mt-4">{plan.name}</h3>
                <div className="text-4xl font-black my-4">${plan.price}</div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-2 font-medium"><CheckCircle size={18} className="text-green-500" /> {plan.shots} AI Headshots</li>
                  <li className="flex items-center gap-2 font-medium"><CheckCircle size={18} className="text-green-500" /> {plan.styles} Unique Styles</li>
                  <li className="flex items-center gap-2 font-medium"><CheckCircle size={18} className="text-green-500" /> 60-min delivery</li>
                </ul>
                <button className={`w-full py-3 rounded-xl font-bold transition ${plan.popular ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}>
                  Buy {plan.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}