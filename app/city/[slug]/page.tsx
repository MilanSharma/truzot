import { Metadata } from "next";
import { notFound } from "next/navigation";
import CityPage from "@/components/seo/CityPage";
import { CITIES } from "@/lib/seo-data/cities";
import { SITE_CONFIG } from "@/lib/seo";
interface Props {
 params: Promise<{ slug: string }>;
}
export async function generateStaticParams() {
 return CITIES.map((city) => ({ slug: city.id }));
}
export async function generateMetadata(props: Props): Promise<Metadata> {
 const params = await props.params;
 const city = CITIES.find((c) => c.id === params.slug);
 if (!city) return { title: "Not Found" };
 // Bare title — the root layout template appends " — Truzot AI Headshots".
 const title = `Professional AI Headshots in ${city.name}, ${city.state}`;
 const description = `Get professional headshots in ${city.name}, ${city.state} without leaving home. AI-generated studio-quality photos starting at $29.`;
 return {
 title,
 description,
 openGraph: {
 title,
 description,
 url: `${SITE_CONFIG.url}/city/${city.id}`,
 siteName: SITE_CONFIG.name,
 locale: "en_US",
 type: "website",
 },
 alternates: { canonical: `${SITE_CONFIG.url}/city/${city.id}` },
 };
}
export default async function CitySlugPage(props: Props) {
 const params = await props.params;
 const city = CITIES.find((c) => c.id === params.slug);
 if (!city) notFound();
 return <CityPage city={city} />;
}
