import Link from "next/link";
import {
  CheckCircle,
  ArrowRight,
  Shield,
  Clock,
  Sparkles,
  Users,
  TrendingUp,
  Award,
  ChevronRight,
  Home,
} from "lucide-react";
import { PLANS } from "@/lib/plans";
import { Profession } from "@/lib/seo-data/professions";
import { CITIES } from "@/lib/seo-data/cities";
import { PROFESSIONS } from "@/lib/seo-data/professions";
import RelatedPages from "./RelatedPages";
import { BreadcrumbSchema, WebPageSchema } from "@/components/JsonLd";

interface ProfessionPageProps {
  profession: Profession;
}

export default function ProfessionPage({ profession }: ProfessionPageProps) {
  // Most profession names pluralize with a plain "s", but two entries aren't
  // people ("LinkedIn", "Resume"), which produced "LinkedIns"/"Resumes". Handle
  // those as special cases so the body copy reads naturally everywhere.
  const plural =
    profession.name === "LinkedIn" ? "LinkedIn users" :
    profession.name === "Resume" ? "resumes" :
    `${profession.name}s`;
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "/" },
          { name: profession.name, url: `/profession/${profession.id}` },
        ]}
      />
      <WebPageSchema
        name={`${profession.title} | Truzot`}
        description={`Get professional ${profession.name.toLowerCase()} headshots with AI. ${profession.description} Starting at $29.`}
      />
      
      {/* Breadcrumb Navigation */}
      <nav className="bg-white border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--text)] transition">
              <Home className="w-4 h-4" />
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="text-[var(--text)] font-medium">{profession.name}</span>
          </div>
        </div>
      </nav>

      <section className="py-20 px-6 bg-gradient-to-b from-slate-50 to-white -[var(--bg-primary)]">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center rounded-full border border-[var(--lime-border)]/60 bg-[var(--lime-dim)]/50 backdrop-blur-sm px-4 py-1.5 text-sm font-semibold text-blue-700 mb-6">
            <Sparkles className="w-4 h-4 mr-2" /> AI-Powered {profession.name}{" "}
            Headshots
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
            {profession.title} in Minutes
          </h1>
          <p className="text-xl text-[var(--text-muted)] max-w-3xl mx-auto mb-10">
            {profession.description}. Get professional-quality headshots
            starting at just $29. No photographer needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/upload"
              className="w-full sm:w-auto bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 dark:bg-slate-100 transition shadow-[var(--shadow-md)] flex items-center justify-center gap-2"
            >
              Generate {profession.name} Headshots{" "}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* What is section for citability */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-[var(--text)]">
            What Are {profession.title}?
          </h2>
          <p className="text-lg text-[var(--text-muted)] mb-8 leading-relaxed">
            {profession.title} are professional photographs specifically
            designed to showcase your expertise, credibility, and professional
            identity. Unlike casual photos, these headshots follow industry
            standards for lighting, composition, and expression that help you
            make a strong first impression. With Truzot&apos;s AI technology,
            you can now get studio-quality {profession.name.toLowerCase()}{" "}
            headshots without the need for expensive photography sessions or
            scheduling conflicts.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="p-6 bg-[var(--bg)] rounded-2xl border border-[var(--border)]">
              <Shield className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="font-bold text-lg mb-2 text-[var(--text)]">
                Professional Quality
              </h3>
              <p className="text-[var(--text-muted)]">
                Studio-grade lighting and composition that meets industry
                standards for {plural}.
              </p>
            </div>
            <div className="p-6 bg-[var(--bg)] rounded-2xl border border-[var(--border)]">
              <Clock className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="font-bold text-lg mb-2 text-[var(--text)]">
                Fast Delivery
              </h3>
              <p className="text-[var(--text-muted)]">
                Get your headshots in as little as 30 minutes with our priority
                delivery options.
              </p>
            </div>
            <div className="p-6 bg-[var(--bg)] rounded-2xl border border-[var(--border)]">
              <Award className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="font-bold text-lg mb-2 text-[var(--text)]">
                Affordable Pricing
              </h3>
              <p className="text-[var(--text-muted)]">
                Starting at just $29, a fraction of traditional photography
                costs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why {profession.name}s need headshots */}
      <section className="py-16 px-6 bg-[var(--bg)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-[var(--text)]">
            Why {plural} Need Professional Headshots
          </h2>
          <p className="text-lg text-[var(--text-muted)] mb-8 leading-relaxed">
            In today&apos;s digital-first professional landscape, your headshot
            is often the first impression you make. Research shows that profiles
            with professional photos receive significantly more engagement,
            connection requests, and opportunities. For {plural}
            specifically, a high-quality headshot conveys trustworthiness,
            competence, and attention to detail—qualities that clients,
            employers, and partners actively seek.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-[var(--border)]">
              <CheckCircle className="w-6 h-6 text-green-600 mt-1 shrink-0" />
              <div>
                <h3 className="font-bold text-[var(--text)] mb-1">
                  Build Trust and Credibility
                </h3>
                <p className="text-[var(--text-muted)]">
                  Professional headshots signal that you take your work
                  seriously and care about quality presentation.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-[var(--border)]">
              <TrendingUp className="w-6 h-6 text-green-600 mt-1 shrink-0" />
              <div>
                <h3 className="font-bold text-[var(--text)] mb-1">
                  Increase Visibility
                </h3>
                <p className="text-[var(--text-muted)]">
                  Profiles with professional photos get up to 21x more profile
                  views and 36x more messages on professional platforms.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-[var(--border)]">
              <Users className="w-6 h-6 text-green-600 mt-1 shrink-0" />
              <div>
                <h3 className="font-bold text-[var(--text)] mb-1">
                  Stand Out from Competition
                </h3>
                <p className="text-[var(--text-muted)]">
                  A polished headshot helps you differentiate yourself in a
                  crowded {profession.name.toLowerCase()} marketplace.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center text-[var(--text)]">
            Frequently Asked Questions About {profession.title}
          </h2>
          <div className="space-y-6">
            {profession.faq.map((item, idx) => (
              <div
                key={idx}
                className="border border-[var(--border)] rounded-xl p-6"
              >
                <h3 className="font-bold text-lg mb-3 text-[var(--text)]">
                  {item.q}
                </h3>
                <p className="text-[var(--text-muted)]">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 border-t border-[var(--border)] bg-white ">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center text-[var(--text)]">
            Top Cities for {profession.name} Headshots
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {CITIES.slice(0, 15).map((c) => (
              <Link
                key={c.id}
                href={`/headshots/${profession.id}-in-${c.id}`}
                className="px-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-full text-sm font-medium text-[var(--text-muted)] hover:border-blue-500 hover:text-[var(--lime)] transition"
              >
                {profession.name} in {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Other Professions Navigation */}
      <section className="py-16 px-6 bg-[var(--bg)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center text-[var(--text)]">
            Explore Other Profession Headshots
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {PROFESSIONS.filter((p) => p.id !== profession.id).map((p) => (
              <Link
                key={p.id}
                href={`/profession/${p.id}`}
                className="p-4 bg-white border border-[var(--border)] rounded-xl hover:border-blue-500 hover:shadow-md transition group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[var(--text-muted)] group-hover:text-[var(--lime)] transition">
                    {p.name}
                  </span>
                  <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-blue-500 transition" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <RelatedPages currentType="profession" currentId={profession.id} />
    </div>
  );
}
