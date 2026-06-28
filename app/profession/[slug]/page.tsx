import { Metadata } from "next";
import { notFound } from "next/navigation";
import ProfessionPage from "@/components/seo/ProfessionPage";
import { PROFESSIONS } from "@/lib/seo-data/professions";
import { SITE_CONFIG } from "@/lib/seo";
interface Props {
  params: Promise<{ slug: string }>;
}
export async function generateStaticParams() {
  return PROFESSIONS.map((profession) => ({ slug: profession.id }));
}
export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const profession = PROFESSIONS.find((p) => p.id === params.slug);
  if (!profession) return { title: "Not Found" };
  const title = `${profession.title} | AI Headshots for ${profession.name}s | Truzot`;
  const description = `Get professional ${profession.name.toLowerCase()} headshots with AI. ${profession.description} Starting at $29.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_CONFIG.url}/profession/${profession.id}`,
      siteName: SITE_CONFIG.name,
      locale: "en_US",
      type: "website",
    },
    alternates: { canonical: `${SITE_CONFIG.url}/profession/${profession.id}` },
  };
}
export default async function ProfessionSlugPage(props: Props) {
  const params = await props.params;
  const profession = PROFESSIONS.find((p) => p.id === params.slug);
  if (!profession) notFound();
  return <ProfessionPage profession={profession} />;
}
