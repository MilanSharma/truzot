import { Metadata } from "next";
import { notFound } from "next/navigation";
import ComboPage from "@/components/seo/ComboPage";
import { PROFESSIONS } from "@/lib/seo-data/professions";
import { CITIES } from "@/lib/seo-data/cities";
import { SITE_CONFIG } from "@/lib/seo";
interface Props {
 params: Promise<{ slug: string }>;
}
export async function generateStaticParams() {
 const params: { slug: string }[] = [];
 for (const profession of PROFESSIONS) {
 for (const city of CITIES) {
 params.push({ slug: `${profession.id}-in-${city.id}` });
 }
 }
 return params;
}
export async function generateMetadata(props: Props): Promise<Metadata> {
 const params = await props.params;
 const match = params.slug.match(/^(.*)-in-(.*)$/);
 if (!match) return { title: "Not Found" };
 const profession = PROFESSIONS.find((p) => p.id === match[1]);
 const city = CITIES.find((c) => c.id === match[2]);
 if (!profession || !city) return { title: "Not Found" };
 const title = `${profession.title} in ${city.name}, ${city.state}`;
 const description = `Get professional ${profession.name.toLowerCase()} headshots in ${city.name} without a studio. Starting at $29.`;
 return {
 title,
 description,
 openGraph: {
 title,
 description,
 url: `${SITE_CONFIG.url}/headshots/${params.slug}`,
 siteName: SITE_CONFIG.name,
 locale: "en_US",
 type: "website",
 },
 alternates: { canonical: `${SITE_CONFIG.url}/headshots/${params.slug}` },
 };
}
export default async function ComboSlugPage(props: Props) {
 const params = await props.params;
 const match = params.slug.match(/^(.*)-in-(.*)$/);
 if (!match) notFound();
 const profession = PROFESSIONS.find((p) => p.id === match[1]);
 const city = CITIES.find((c) => c.id === match[2]);
 if (!profession || !city) notFound();
 return <ComboPage profession={profession} city={city} />;
}
