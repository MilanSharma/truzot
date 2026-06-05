const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://truzot.com";

export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Truzot",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description: "AI-powered professional headshot generation service.",
    sameAs: [],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ProductSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "AI Professional Headshots",
    description: "Generate AI-powered professional headshots from your photos.",
    url: siteUrl,
    offers: [
      {
        "@type": "Offer",
        name: "Basic",
        price: "29",
        priceCurrency: "USD",
        description: "40 headshots",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "49",
        priceCurrency: "USD",
        description: "80 headshots",
      },
      {
        "@type": "Offer",
        name: "Executive",
        price: "79",
        priceCurrency: "USD",
        description: "120 headshots",
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
