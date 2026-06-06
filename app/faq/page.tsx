"use client";
import { useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { FAQSchema, SpeakableSchema } from "@/components/JsonLd";

const faqs = {
  individual: [
    {
      q: "How many photos should I upload?",
      a: "Upload 1-5 clear selfies. The more variety in angles and lighting, the better your headshots will look.",
    },
    {
      q: "What if I don\u2019t like my headshots?",
      a: "100% money-back guarantee within 14 days.",
    },
    {
      q: "How fast will I get my headshots?",
      a: "Basic: 2 hours, Pro: 1 hour, Executive: 30 minutes.",
    },
  ],
  free: [
    {
      q: "Do I need to sign up?",
      a: "No, the free generator requires no account.",
    },
    {
      q: "Can I download all 9 styles for free?",
      a: "Only one HD image is free. Unlock all with a paid plan.",
    },
  ],
  team: [
    {
      q: "How does team pricing work?",
      a: "Volume discounts apply. Contact us for a quote.",
    },
    {
      q: "Can I manage multiple employees?",
      a: "Yes, admin dashboard with invites and progress tracking.",
    },
  ],
};

export default function FAQPage() {
  const [open, setOpen] = useState<{ [key: string]: boolean }>({});
  const toggle = (key: string) =>
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const allFaqs = [...faqs.individual, ...faqs.free, ...faqs.team];
  return (
    <div
      id="main-content"
      className="min-h-screen bg-slate-50 dark:bg-slate-950"
    >
      <FAQSchema
        questions={allFaqs.map((f) => ({ question: f.q, answer: f.a }))}
      />
      <SpeakableSchema cssSelector={["h1", "h2", ".faq-question"]} />
      <Nav />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-10 text-slate-900 dark:text-white">
          Frequently Asked Questions
        </h1>
        {Object.entries(faqs).map(([section, items]) => (
          <div key={section} className="mb-10">
            <h2 className="text-xl font-bold mb-4 text-blue-600 capitalize border-b-2 border-blue-600 inline-block">
              {section}
            </h2>
            {items.map((faq, idx) => {
              const key = `${section}-${idx}`;
              return (
                <div
                  key={key}
                  className="border-b border-slate-200 dark:border-slate-700"
                >
                  <button
                    onClick={() => toggle(key)}
                    className="faq-question w-full text-left py-4 font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 transition flex justify-between items-center gap-4"
                  >
                    <span>{faq.q}</span>
                    <span
                      className={`text-blue-600 transition-transform ${open[key] ? "rotate-180" : ""}`}
                    >
                      ▼
                    </span>
                  </button>
                  {open[key] && (
                    <div className="pb-4 text-slate-600 dark:text-slate-400 leading-relaxed animate-slide-up">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
}
