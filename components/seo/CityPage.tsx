import Link from "next/link";
import {
  CheckCircle,
  ArrowRight,
  Shield,
  Clock,
  Sparkles,
  MapPin,
  TrendingUp,
  Users,
  Award,
} from "lucide-react";
import { PLANS } from "@/lib/plans";
import { City } from "@/lib/seo-data/cities";
import { PROFESSIONS } from "@/lib/seo-data/professions";
import RelatedPages from "./RelatedPages";
import { SITE_CONFIG } from "@/lib/seo";
import { BreadcrumbSchema, WebPageSchema } from "@/components/JsonLd";

interface CityPageProps {
  city: City;
}

export default function CityPage({ city }: CityPageProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `Truzot AI Headshots ${city.name}`,
    image: `${SITE_CONFIG.url}/logo.png`,
    address: {
      "@type": "PostalAddress",
      addressLocality: city.name,
      addressRegion: city.state,
      addressCountry: "US",
    },
    priceRange: "$$",
    url: `${SITE_CONFIG.url}/city/${city.id}`,
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "/" },
          { name: city.name, url: `/city/${city.id}` },
        ]}
      />
      <WebPageSchema
        name={`Professional Headshots in ${city.name}, ${city.state} | Truzot`}
        description={`Get studio-quality AI headshots without leaving ${city.name}. Starting at just $29. Delivered in 30 minutes.`}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <section className="py-20 px-6 bg-gradient-to-b from-slate-50 to-white -[var(--bg-primary)]">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center rounded-full border border-[var(--lime-border)]/60 bg-[var(--lime-dim)]/50 backdrop-blur-sm px-4 py-1.5 text-sm font-semibold text-blue-700 mb-6">
            <MapPin className="w-4 h-4 mr-2" /> Serving {city.name},{" "}
            {city.state}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
            Professional Headshots in {city.name}, {city.state}
          </h1>
          <p className="text-xl text-[var(--text-muted)] max-w-3xl mx-auto mb-10">
            Get studio-quality AI headshots without leaving {city.name}.
            Starting at just $29. Delivered in 30 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/upload"
              className="w-full sm:w-auto bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 dark:bg-slate-100 transition shadow-[var(--shadow-md)] flex items-center justify-center gap-2"
            >
              Get {city.name} Headshots <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/pricing"
              className="w-full sm:w-auto bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] px-8 py-4 rounded-2xl font-bold text-lg hover:bg-[var(--bg)] dark:bg-slate-800 transition shadow-sm flex items-center justify-center"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Why choose AI headshots in {city.name} */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center text-[var(--text)]">
            Why {city.name} Professionals Choose AI Headshots
          </h2>
          <p className="text-lg text-[var(--text-muted)] mb-8 leading-relaxed text-center">
            {city.name} professionals need headshots that stand out in
            competitive markets like tech, finance, and real estate. Traditional
            photography studios in {city.name} charge $200-500 for a single
            session with limited outfit changes. Truzot delivers 40-150
            headshots in multiple styles for a fraction of the cost, all without
            leaving your home.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="p-6 bg-[var(--bg)] rounded-2xl border border-[var(--border)]">
              <Shield className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="font-bold text-lg mb-2 text-[var(--text)]">
                No Studio Needed
              </h3>
              <p className="text-[var(--text-muted)]">
                Upload photos from anywhere in {city.name}. No commute, no
                scheduling conflicts, no studio fees.
              </p>
            </div>
            <div className="p-6 bg-[var(--bg)] rounded-2xl border border-[var(--border)]">
              <Clock className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="font-bold text-lg mb-2 text-[var(--text)]">
                Fast Delivery
              </h3>
              <p className="text-[var(--text-muted)]">
                Receive your headshots in as little as 30 minutes with our
                priority delivery option.
              </p>
            </div>
            <div className="p-6 bg-[var(--bg)] rounded-2xl border border-[var(--border)]">
              <Award className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="font-bold text-lg mb-2 text-[var(--text)]">
                Multiple Styles
              </h3>
              <p className="text-[var(--text-muted)]">
                Get headshots in corporate, creative, casual, and
                LinkedIn-optimized styles from one upload.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular professions in {city.name} */}
      <section className="py-16 px-6 bg-[var(--bg)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center text-[var(--text)]">
            Popular Headshot Services in {city.name}
          </h2>
          <p className="text-lg text-[var(--text-muted)] mb-8 text-center">
            From {city.name}&apos;s tech professionals to real estate agents, we
            serve all industries with specialized headshot styles.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {PROFESSIONS.map((p) => (
              <Link
                key={p.id}
                href={`/headshots/${p.id}-in-${city.id}`}
                className="px-4 py-2 bg-white border border-[var(--border)] rounded-full text-sm font-medium text-[var(--text-muted)] hover:border-blue-500 hover:text-[var(--lime)] transition"
              >
                {p.name} Headshots in {city.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center text-[var(--text)]">
            How to Get Headshots in {city.name}
          </h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-6 bg-[var(--bg)] rounded-xl border border-[var(--border)]">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">
                1
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2 text-[var(--text)]">
                  Upload Your Photos
                </h3>
                <p className="text-[var(--text-muted)]">
                  Take 2-10 selfies with your phone in good lighting. No
                  professional equipment needed.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-6 bg-[var(--bg)] rounded-xl border border-[var(--border)]">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">
                2
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2 text-[var(--text)]">
                  Customize Your Style
                </h3>
                <p className="text-[var(--text-muted)]">
                  Choose from 6+ style categories including corporate, LinkedIn,
                  creative, and casual. Select eye color, clothing, and
                  background preferences.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-6 bg-[var(--bg)] rounded-xl border border-[var(--border)]">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">
                3
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2 text-[var(--text)]">
                  Receive Your Headshots
                </h3>
                <p className="text-[var(--text-muted)]">
                  Get 40-150 HD headshots delivered to your email in 30 minutes
                  to 2 hours. Download and use them anywhere.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <RelatedPages currentType="city" currentId={city.id} />
    </div>
  );
}
