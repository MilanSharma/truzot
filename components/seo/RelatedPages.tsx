import Link from "next/link";
import { PROFESSIONS } from "@/lib/seo-data/professions";
import { CITIES } from "@/lib/seo-data/cities";
import { STYLES } from "@/lib/seo-data/styles";

interface RelatedPagesProps {
  currentType?: "profession" | "city" | "style";
  currentId?: string;
}

export default function RelatedPages({ currentType, currentId }: RelatedPagesProps) {
  const relatedProfessions = PROFESSIONS.filter((p) => p.id !== currentId).slice(0, 4);
  const relatedCities = CITIES.filter((c) => c.id !== currentId).slice(0, 4);
  const relatedStyles = STYLES.filter((s) => s.id !== currentId).slice(0, 4);

  return (
    <section className="py-16 px-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-extrabold tracking-tight mb-8 text-center">Explore More Headshot Options</h2>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div>
            <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">By Profession</h3>
            <ul className="space-y-2">
              {relatedProfessions.map((profession) => (
                <li key={profession.id}>
                  <Link href={`/profession/${profession.id}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    {profession.name} Headshots
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">By Location</h3>
            <ul className="space-y-2">
              {relatedCities.map((city) => (
                <li key={city.id}>
                  <Link href={`/city/${city.id}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    {city.name}, {city.state}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">By Style</h3>
            <ul className="space-y-2">
              {relatedStyles.map((style) => (
                <li key={style.id}>
                  <Link href={`/style/${style.id}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    {style.name} Headshots
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
