const siteUrl = "https://www.truzot.com";

const socialProfiles = [
 "https://twitter.com/truzot",
 "https://linkedin.com/company/truzot",
];

export function OrganizationSchema() {
 const schema = {
 "@context": "https://schema.org",
 "@type": "Organization",
 "@id": `${siteUrl}/#organization`,
 name: "Truzot",
 url: siteUrl,
 logo: `${siteUrl}/logo.png`,
 description:
 "AI-powered professional headshot generation service. Generate studio-quality corporate, LinkedIn, and executive headshots from your photos in minutes.",
 sameAs: socialProfiles,
 foundingDate: "2025",
 email: "hello@truzot.com",
 contactPoint: [
 {
 "@type": "ContactPoint",
 url: `${siteUrl}/contact`,
 contactType: "customer support",
 email: "hello@truzot.com",
 },
 {
 "@type": "ContactPoint",
 url: `${siteUrl}/contact`,
 contactType: "sales",
 email: "hello@truzot.com",
 },
 ],
 };
 return (
 <script
 type="application/ld+json"
 dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
 />
 );
}

export function WebSiteSchema() {
 const schema = {
 "@context": "https://schema.org",
 "@type": "WebSite",
 "@id": `${siteUrl}/#website`,
 name: "Truzot",
 url: siteUrl,
 description:
 "Generate AI-powered professional headshots from your photos. No studio, no photographer. Get LinkedIn-ready corporate headshots in under an hour.",
 publisher: { "@id": `${siteUrl}/#organization` },
 inLanguage: "en-US",
 potentialAction: {
 "@type": "SearchAction",
 target: {
 "@type": "EntryPoint",
 urlTemplate: `${siteUrl}/?s={search_term_string}`,
 },
 "query-input": "required name=search_term_string",
 },
 };
 return (
 <script
 type="application/ld+json"
 dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
 />
 );
}

export function ProductSchema() {
 const priceValidUntil = "2026-06-18T00:00:00.000Z";

 const schema = {
 "@context": "https://schema.org",
 "@type": "Product",
 "@id": `${siteUrl}/#product`,
 name: "AI Professional Headshots",
 description:
 "Generate AI-powered professional headshots from your photos. Multiple styles, clothing options, and backgrounds. Perfect for LinkedIn, company pages, and personal branding.",
 url: siteUrl,
 brand: { "@type": "Brand", name: "Truzot" },
 category: "Professional Photography Services",
 offers: [
 {
 "@type": "Offer",
 name: "Basic",
 price: "29",
 priceCurrency: "USD",
 description: "40 HD headshots with 10+ styles. 2-hour delivery.",
 priceValidUntil,
 availability: "https://schema.org/InStock",
 url: `${siteUrl}/upload?plan=basic`,
 },
 {
 "@type": "Offer",
 name: "Pro",
 price: "39",
 priceCurrency: "USD",
 description:
 "100 premium 4K headshots with 30+ styles. 1-hour delivery.",
 priceValidUntil,
 availability: "https://schema.org/InStock",
 url: `${siteUrl}/upload?plan=pro`,
 },
 {
 "@type": "Offer",
 name: "Executive",
 price: "59",
 priceCurrency: "USD",
 description:
 "200 ultra 8K headshots with all styles. 30-minute priority delivery.",
 priceValidUntil,
 availability: "https://schema.org/InStock",
 url: `${siteUrl}/upload?plan=executive`,
 },
 ],
 aggregateRating: {
 "@type": "AggregateRating",
 ratingValue: "4.9",
 bestRating: "5",
 ratingCount: "642",
 reviewCount: "642",
 },
 review: [
 {
 "@type": "Review",
 author: { "@type": "Person", name: "Sarah K." },
 reviewRating: { "@type": "Rating", ratingValue: "5" },
 reviewBody:
 "Got hired after updating my LinkedIn with these headshots. Best $39 I ever spent.",
 },
 {
 "@type": "Review",
 author: { "@type": "Person", name: "Marcus T." },
 reviewRating: { "@type": "Rating", ratingValue: "5" },
 reviewBody:
 "The team plan saved us thousands vs. a photo studio. The consistency across all headshots is incredible.",
 },
 {
 "@type": "Review",
 author: { "@type": "Person", name: "David L." },
 reviewRating: { "@type": "Rating", ratingValue: "5" },
 reviewBody:
 "Updated my resume and LinkedIn in 10 minutes. Got 3x more profile views in the first week.",
 },
 ],
 };
 return (
 <script
 type="application/ld+json"
 dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
 />
 );
}

export function FAQSchema({
 questions,
}: {
 questions: { question: string; answer: string }[];
}) {
 const schema = {
 "@context": "https://schema.org",
 "@type": "FAQPage",
 "@id": `${siteUrl}/faq/#faq`,
 mainEntity: questions.map((q) => ({
 "@type": "Question",
 name: q.question,
 acceptedAnswer: { "@type": "Answer", text: q.answer },
 })),
 };
 return (
 <script
 type="application/ld+json"
 dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
 />
 );
}

export function HowToSchema() {
 const schema = {
 "@context": "https://schema.org",
 "@type": "HowTo",
 name: "How to Generate AI Professional Headshots",
 description:
 "Get studio-quality professional headshots from your phone photos in just 3 steps.",
 image: `${siteUrl}/og-image.png`,
 estimatedCost: { "@type": "MonetaryAmount", currency: "USD", value: "29" },
 totalTime: "PT10M",
 step: [
 {
 "@type": "HowToStep",
 name: "Upload your photos",
 text: "Upload 1-5 casual selfies from your phone. No professional photography required.",
 image: `${siteUrl}/howto-upload.jpg`,
 url: `${siteUrl}/upload`,
 },
 {
 "@type": "HowToStep",
 name: "Customize your look",
 text: "Select your eye color, clothing style, background, and choose from 6 AI style categories including corporate, LinkedIn, creative, and casual.",
 image: `${siteUrl}/howto-customize.jpg`,
 url: `${siteUrl}/upload`,
 },
 {
 "@type": "HowToStep",
 name: "Download your headshots",
 text: "Get 40-200 HD headshots delivered in as fast as 10 minutes. Use them on LinkedIn, resumes, company pages, company pages, and anywhere you need a professional image.",
 image: `${siteUrl}/howto-download.jpg`,
 url: `${siteUrl}/upload`,
 },
 ],
 };
 return (
 <script
 type="application/ld+json"
 dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
 />
 );
}

export function SpeakableSchema({
 cssSelector = ["#main-content h1", "#main-content p:first-of-type"],
}: {
 cssSelector?: string[];
}) {
 const schema = {
 "@context": "https://schema.org",
 "@type": "WebPage",
 "@id": `${siteUrl}/#speakable`,
 speakable: {
 "@type": "SpeakableSpecification",
 cssSelector,
 },
 };
 return (
 <script
 type="application/ld+json"
 dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
 />
 );
}

export function ServiceSchema() {
 const schema = {
 "@context": "https://schema.org",
 "@type": "Service",
 "@id": `${siteUrl}/#service`,
 name: "AI Headshot Generation Service",
 description:
 "Professional AI-powered headshot generation for individuals and teams. Upload selfies and get corporate, LinkedIn, and executive-quality headshots in minutes.",
 provider: { "@id": `${siteUrl}/#organization` },
 serviceType: "Professional Photography",
 areaServed: "US",
 category: "Digital Photography",
 offers: {
 "@type": "AggregateOffer",
 lowPrice: "29",
 highPrice: "59",
 priceCurrency: "USD",
 },
 };
 return (
 <script
 type="application/ld+json"
 dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
 />
 );
}

export function BreadcrumbSchema({
 items,
}: {
 items: { name: string; url: string }[];
}) {
 const schema = {
 "@context": "https://schema.org",
 "@type": "BreadcrumbList",
 "@id": `${siteUrl}${items[items.length - 1]?.url || "/"}#breadcrumb`,
 itemListElement: items.map((item, i) => ({
 "@type": "ListItem",
 position: i + 1,
 name: item.name,
 item: `${siteUrl}${item.url}`,
 })),
 };
 return (
 <script
 type="application/ld+json"
 dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
 />
 );
}

export function BlogPostingSchema({
 title,
 description,
 datePublished,
 dateModified,
 author,
 image,
}: {
 title: string;
 description: string;
 datePublished: string;
 dateModified?: string;
 author?: string;
 image?: string;
}) {
 const schema = {
 "@context": "https://schema.org",
 "@type": "BlogPosting",
 "@id": `${siteUrl}/blog/${title
 .toLowerCase()
 .replace(/\s+/g, "-")
 .replace(/[^\w-]/g, "")}#blogposting`,
 headline: title,
 description,
 author: {
 "@type": "Person",
 name: author || "Truzot Team",
 },
 publisher: {
 "@type": "Organization",
 name: "Truzot",
 logo: { "@type": "ImageObject", url: `${siteUrl}/logo.png` },
 },
 datePublished,
 dateModified: dateModified || datePublished,
 image: image || `${siteUrl}/og-image.png`,
 mainEntityOfPage: {
 "@type": "WebPage",
 "@id": `${siteUrl}/blog/${title.toLowerCase().replace(/\s+/g, "-")}`,
 },
 };
 return (
 <script
 type="application/ld+json"
 dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
 />
 );
}

export function WebPageSchema({
 name,
 description,
}: {
 name: string;
 description: string;
}) {
 const schema = {
 "@context": "https://schema.org",
 "@type": "WebPage",
 "@id": `${siteUrl}/#webpage`,
 name,
 description,
 publisher: { "@id": `${siteUrl}/#organization` },
 inLanguage: "en-US",
 isPartOf: { "@id": `${siteUrl}/#website` },
 };
 return (
 <script
 type="application/ld+json"
 dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
 />
 );
}

export function AggregateRatingSchema() {
 const schema = {
 "@context": "https://schema.org",
 "@type": "Product",
 "@id": `${siteUrl}/#rating`,
 name: "Truzot AI Headshots",
 aggregateRating: {
 "@type": "AggregateRating",
 ratingValue: "4.9",
 bestRating: "5",
 worstRating: "1",
 ratingCount: "642",
 reviewCount: "642",
 },
 };
 return (
 <script
 type="application/ld+json"
 dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
 />
 );
}
