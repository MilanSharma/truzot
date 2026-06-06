const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://truzot.com";

const socialProfiles = [
  "https://twitter.com/truzot",
  "https://linkedin.com/company/truzot",
];

export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Truzot",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description: "AI-powered professional headshot generation service.",
    sameAs: socialProfiles,
    contactPoint: {
      "@type": "ContactPoint",
      url: `${siteUrl}/contact`,
      contactType: "customer support",
    },
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
    name: "Truzot",
    url: siteUrl,
    description: "Generate AI-powered professional headshots from your photos.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/blog?q={search_term_string}`,
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
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "AI Professional Headshots",
    description:
      "Generate AI-powered professional headshots from your photos. Multiple styles, clothing options, and backgrounds.",
    url: siteUrl,
    brand: { "@type": "Brand", name: "Truzot" },
    offers: [
      {
        "@type": "Offer",
        name: "Basic",
        price: "29",
        priceCurrency: "USD",
        description: "40 headshots, 5 styles",
        priceValidUntil: new Date(
          new Date().setFullYear(new Date().getFullYear() + 1),
        ).toISOString(),
        availability: "https://schema.org/InStock",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "39",
        priceCurrency: "USD",
        description: "100 headshots, all styles",
        priceValidUntil: new Date(
          new Date().setFullYear(new Date().getFullYear() + 1),
        ).toISOString(),
        availability: "https://schema.org/InStock",
      },
      {
        "@type": "Offer",
        name: "Executive",
        price: "59",
        priceCurrency: "USD",
        description: "200 headshots, all styles, priority delivery",
        priceValidUntil: new Date(
          new Date().setFullYear(new Date().getFullYear() + 1),
        ).toISOString(),
        availability: "https://schema.org/InStock",
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

export function BreadcrumbSchema({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
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
    headline: title,
    description,
    author: {
      "@type": "Person",
      name: author || "Truzot Team",
    },
    publisher: {
      "@type": "Organization",
      name: "Truzot",
      logo: `${siteUrl}/logo.png`,
    },
    datePublished,
    dateModified: dateModified || datePublished,
    image: image || `${siteUrl}/og-image.png`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": siteUrl,
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
    name,
    description,
    publisher: { "@type": "Organization", name: "Truzot" },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
