import { Metadata } from "next";
import { notFound } from "next/navigation";
import StylePage from "@/components/seo/StylePage";
import { STYLES } from "@/lib/seo-data/styles";
import { SITE_CONFIG } from "@/lib/seo";
interface Props {
 params: Promise<{ slug: string }>;
}
export async function generateStaticParams() {
 return STYLES.map((style) => ({ slug: style.id }));
}
export async function generateMetadata(props: Props): Promise<Metadata> {
 const params = await props.params;
 const style = STYLES.find((s) => s.id === params.slug);
 if (!style) return { title: "Not Found" };
 const title = `${style.title} | AI Headshots`;
 const description = `${style.description} Perfect for ${style.useCase.toLowerCase()}. Starting at $29.`;
 return {
 title,
 description,
 openGraph: {
 title,
 description,
 url: `${SITE_CONFIG.url}/style/${style.id}`,
 siteName: SITE_CONFIG.name,
 locale: "en_US",
 type: "website",
 },
 alternates: { canonical: `${SITE_CONFIG.url}/style/${style.id}` },
 };
}
export default async function StyleSlugPage(props: Props) {
 const params = await props.params;
 const style = STYLES.find((s) => s.id === params.slug);
 if (!style) notFound();
 return <StylePage style={style} />;
}
