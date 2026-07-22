"use client";
import { useState, useMemo } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import {
  FAQSchema,
  SpeakableSchema,
  BreadcrumbSchema,
} from "@/components/JsonLd";
import {
  Search,
  ChevronDown,
  Mail,
  Users,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

const CATEGORY_META: Record<
  string,
  { label: string; icon: React.ReactNode; desc: string }
> = {
  individual: {
    label: "Getting Started",
    icon: <HelpCircle className="w-5 h-5" />,
    desc: "Everything about creating your AI headshots",
  },
  free: {
    label: "Free Generator",
    icon: <Mail className="w-5 h-5" />,
    desc: "Try before you buy with our free tier",
  },
  team: {
    label: "Teams & Enterprise",
    icon: <Users className="w-5 h-5" />,
    desc: "Volume pricing and management tools",
  },
};

const faqs = {
  individual: [
    {
      q: "How many photos do I need to upload?",
      a: (
        <>
          <p className="mb-3">
            We recommend uploading <strong>3-5 clear selfies</strong> with good
            lighting. The more variety in angles and lighting, the better your
            AI headshots will look.
          </p>
          <p className="text-sm">
            One well-lit photo can work, but 3-5 photos from different angles
            help the AI understand your facial features more accurately and
            produce more natural-looking results across all styles.
          </p>
        </>
      ),
    },
    {
      q: "How long does it take to get my headshots?",
      a: (
        <>
          <p className="mb-3">
            Most headshots are ready within{" "}
            <strong>5 minutes to 20 minutes</strong>, depending on your plan:
          </p>
          <ul className="space-y-1.5 mb-3">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />
              Basic: ~20 minutes
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />
              Pro: ~10 minutes
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />
              Executive: ~5 minutes
            </li>
          </ul>
          <p className="text-sm text-[var(--text-muted)]">
            Processing times are estimates. Most orders complete faster than the
            listed turnaround.
          </p>
        </>
      ),
    },
    {
      q: "What if I don't like my headshots?",
      a: (
        <>
          <p className="mb-3">
            We offer a <strong>100% money-back guarantee</strong> within 30 days
            of delivery. If you&apos;re not satisfied with your AI headshots for
            any reason, we&apos;ll refund your order — no questions asked.
          </p>
          <p className="mb-3">
            You can request a refund directly from your{" "}
            <Link
              href="/dashboard"
              className="text-lime-400 hover:underline font-medium"
            >
              dashboard
            </Link>{" "}
            or email{" "}
            <a
              href="mailto:hello@truzot.com"
              className="text-lime-400 hover:underline"
            >
              hello@truzot.com
            </a>
            .
          </p>
          <Link
            href="/refund"
            className="inline-flex items-center gap-1 text-sm text-lime-400 hover:underline font-medium"
          >
            View full refund policy <ExternalLink className="w-3 h-3" />
          </Link>
        </>
      ),
    },
    {
      q: "Are AI headshots good enough for LinkedIn?",
      a: (
        <>
          <p className="mb-3">
            Yes — our AI headshots are optimized for LinkedIn and other
            professional platforms. They&apos;re{" "}
            <strong>
              indistinguishable from studio photography to the naked eye
            </strong>
            .
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            In fact, profiles with professional headshots receive 14x more
            profile views and 36x more recruiter messages. Our AI headshots give
            you the same advantage at a fraction of the cost.
          </p>
        </>
      ),
    },
    {
      q: "Can I use the headshots commercially?",
      a: (
        <>
          <p>
            Yes — all headshots come with{" "}
            <strong>full commercial usage rights</strong>. Use them on LinkedIn,
            your company website, resumes, marketing materials, business cards,
            and anywhere else you need a professional image.
          </p>
        </>
      ),
    },
    {
      q: "What styles and backgrounds are available?",
      a: (
        <>
          <p className="mb-3">
            We offer <strong>6 style categories</strong> with dozens of
            variations:
          </p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              "Corporate & Executive",
              "LinkedIn Professional",
              "Creative & Editorial",
              "Casual & Outdoor",
              "Startup & Tech",
              "Real Estate & Sales",
            ].map((s) => (
              <span
                key={s}
                className="text-sm bg-[var(--surface)] px-3 py-1.5 rounded-lg text-[var(--text-secondary)]"
              >
                {s}
              </span>
            ))}
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Each style generates multiple unique headshots with different poses,
            expressions, and subtle variations.
          </p>
        </>
      ),
    },
  ],
  free: [
    {
      q: "Do I need to create an account for the free headshot?",
      a: (
        <p>
          Yes — a quick <strong>free sign-up</strong> is required to prevent
          abuse. It takes 10 seconds and no credit card is needed.
        </p>
      ),
    },
    {
      q: "What's included in the free tier?",
      a: (
        <>
          <p className="mb-3">
            The free tier gives you <strong>one HD headshot</strong> in a single
            style. You can see the quality of our AI generation before
            committing to a paid plan.
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            Upgrade to Basic ($29), Pro ($39), or Executive ($59) to unlock all
            styles, more headshots, higher resolution, and faster delivery.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1 mt-3 text-sm text-lime-400 hover:underline font-medium"
          >
            See pricing <ExternalLink className="w-3 h-3" />
          </Link>
        </>
      ),
    },
  ],
  team: [
    {
      q: "How does team pricing work?",
      a: (
        <>
          <p className="mb-3">
            Team plans offer <strong>volume discounts</strong> for organizations
            with 5+ employees. The per-person cost decreases as your team grows.
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            Contact us for a custom quote based on your team size and
            requirements. We&apos;ll provide a pricing proposal within 24 hours.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1 mt-3 text-sm text-lime-400 hover:underline font-medium"
          >
            Contact sales <ExternalLink className="w-3 h-3" />
          </Link>
        </>
      ),
    },
    {
      q: "Can I manage multiple employees from one account?",
      a: (
        <>
          <p>
            Yes — team plans include an <strong>admin dashboard</strong> where
            you can invite team members, track progress, and manage all orders
            from a single account. Each team member gets their own photo upload
            and customization flow, but everything is managed centrally.
          </p>
        </>
      ),
    },
  ],
};

function AccordionItem({
  question,
  children,
  isOpen,
  onToggle,
}: {
  question: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-[var(--border)] rounded-2xl overflow-hidden transition-colors">
      <button
        onClick={onToggle}
        className="faq-question w-full text-left px-5 py-4 font-semibold text-[var(--text)] hover:bg-white/[0.03] transition flex items-center justify-between gap-4 group"
      >
        <span className="group-hover:text-lime-400 transition">{question}</span>
        <ChevronDown
          className={`w-4 h-4 text-[var(--text-muted)] shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-5 pb-4 text-[var(--text-muted)] leading-relaxed text-sm">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function FAQPage() {
  const [open, setOpen] = useState<{ [key: string]: boolean }>({});
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<{ [key: string]: boolean }>({});

  const toggle = (key: string) =>
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const allFaqs = useMemo(
    () => [
      ...faqs.individual.map((f) => ({ ...f, section: "individual" })),
      ...faqs.free.map((f) => ({ ...f, section: "free" })),
      ...faqs.team.map((f) => ({ ...f, section: "team" })),
    ],
    [],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return allFaqs;
    const q = search.toLowerCase();
    return allFaqs.filter(
      (f) =>
        f.q.toLowerCase().includes(q) ||
        CATEGORY_META[f.section]?.label.toLowerCase().includes(q),
    );
  }, [search, allFaqs]);

  const groupedFiltered = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    for (const f of filtered) {
      if (!groups[f.section]) groups[f.section] = [];
      groups[f.section].push(f);
    }
    return groups;
  }, [filtered]);

  return (
    <div className="min-h-screen">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "/" },
          { name: "FAQ", url: "/faq" },
        ]}
      />
      <FAQSchema
        questions={[
          // (schema unchanged - still works)
          {
            question: "How many photos do I need to upload?",
            answer:
              "We recommend uploading 3-5 clear selfies with good lighting for best results.",
          },
          {
            question: "How long does it take to get my headshots?",
            answer:
              "Most headshots are ready within 5 minutes to 20 minutes, depending on your plan. Basic: 20 minutes, Pro: 10 minutes, Executive: 5 minutes.",
          },
          {
            question: "What if I don't like my headshots?",
            answer:
              "We offer a 100% money-back guarantee within 30 days of delivery. Request a refund from your dashboard or email hello@truzot.com.",
          },
          {
            question: "Are AI headshots good enough for LinkedIn?",
            answer:
              "Yes, our AI headshots are optimized for LinkedIn and are indistinguishable from studio photography. Profiles with professional headshots receive 14x more views.",
          },
          {
            question: "Can I use the headshots commercially?",
            answer:
              "Yes, all headshots come with full commercial usage rights for LinkedIn, company websites, resumes, marketing materials, and more.",
          },
          {
            question: "What styles and backgrounds are available?",
            answer:
              "We offer 6 style categories: Corporate & Executive, LinkedIn Professional, Creative & Editorial, Casual & Outdoor, Startup & Tech, and Real Estate & Sales.",
          },
          {
            question: "Do I need to create an account for the free headshot?",
            answer:
              "Yes, a quick sign-up is required to prevent abuse. It takes 10 seconds and no credit card is needed.",
          },
          {
            question: "What's included in the free tier?",
            answer:
              "The free tier gives you one HD headshot in a single style. Upgrade to paid plans starting at $29 to unlock all styles and resolutions.",
          },
          {
            question: "How does team pricing work?",
            answer:
              "Team plans offer volume discounts for organizations with 5+ employees. Contact us for a custom quote.",
          },
          {
            question: "Can I manage multiple employees from one account?",
            answer:
              "Yes, team plans include an admin dashboard to invite team members, track progress, and manage orders centrally.",
          },
        ]}
      />
      <SpeakableSchema cssSelector={["h1", ".faq-question"]} />
      <Nav />
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-[var(--text)] mb-4 tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-[var(--text-muted)] max-w-xl mx-auto">
            Everything you need to know about AI headshots. Can&apos;t find what
            you&apos;re looking for?{" "}
            <Link
              href="/contact"
              className="text-lime-400 hover:underline font-medium"
            >
              Contact us
            </Link>
            .
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-faint)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] placeholder-[var(--text-faint)] focus:ring-2 focus:ring-lime-400/50 outline-none transition shadow-sm"
          />
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {Object.entries(groupedFiltered ?? {}).map(([section, items]) => {
            const meta = CATEGORY_META[section];
            return (
              <div key={section}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-lime-400/10 flex items-center justify-center text-lime-400">
                    {meta?.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text)]">
                      {meta?.label}
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">
                      {meta?.desc}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {items.map((faq, idx) => {
                    const key = `${section}-${idx}`;
                    return (
                      <AccordionItem
                        key={key}
                        question={faq.q}
                        isOpen={!!open[key]}
                        onToggle={() => toggle(key)}
                      >
                        {faq.a}
                        {/* Helpful feedback */}
                        <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center gap-3 text-xs text-[var(--text-muted)]">
                          <span>Was this helpful?</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFeedback((prev) => ({
                                ...prev,
                                [key]: true,
                              }));
                            }}
                            className={`hover:text-emerald-400 transition ${
                              feedback[key] === true ? "text-emerald-400" : ""
                            }`}
                          >
                            👍
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFeedback((prev) => ({
                                ...prev,
                                [key]: false,
                              }));
                            }}
                            className={`hover:text-red-400 transition ${
                              feedback[key] === false ? "text-red-400" : ""
                            }`}
                          >
                            👎
                          </button>
                        </div>
                      </AccordionItem>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <HelpCircle className="w-12 h-12 text-[var(--text)]/10 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[var(--text)] mb-2">
              No results found
            </h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Try a different search term or browse the categories above.
            </p>
            <button
              onClick={() => setSearch("")}
              className="text-sm text-lime-400 hover:underline font-medium"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Contact CTA */}
        <div className="mt-12 bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-[var(--text)] mb-2">
            Still have questions?
          </h2>
          <p className="text-sm text-[var(--text-muted)] mb-6 max-w-md mx-auto">
            Our team typically responds within a few hours — often sooner.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-lime-400 text-black px-6 py-3 rounded-2xl font-semibold hover:bg-lime-300 transition text-sm"
            >
              <Mail className="w-4 h-4" /> Contact Support
            </Link>
            <a
              href="mailto:hello@truzot.com"
              className="inline-flex items-center gap-2 border border-[var(--border)] text-[var(--text-secondary)] px-6 py-3 rounded-2xl font-semibold hover:bg-[var(--surface)] transition text-sm"
            >
              hello@truzot.com
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
