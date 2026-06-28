export const STYLES = [
  {
    id: "corporate",
    name: "Corporate",
    title: "Corporate Headshots",
    description:
      "Professional business headshots with formal attire and neutral backgrounds perfect for executives and professionals",
    keywords: ["corporate headshot", "business headshot"],
    useCase:
      "Ideal for executives, lawyers, consultants, and corporate professionals who need authoritative, traditional headshots",
  },
  {
    id: "creative",
    name: "Creative",
    title: "Creative Headshots",
    description:
      "Artistic and expressive headshots with unique styling for creative professionals and artists",
    keywords: ["creative headshot", "artistic headshot"],
    useCase:
      "Perfect for designers, artists, marketers, and creative professionals who want to showcase their personality",
  },
  {
    id: "studio",
    name: "Studio",
    title: "Studio Headshots",
    description:
      "Classic studio lighting headshots with professional backgrounds for timeless professional photos",
    keywords: ["studio headshot", "professional studio photo"],
    useCase:
      "Traditional studio-style headshots perfect for any professional seeking a classic, polished look",
  },
  {
    id: "outdoor",
    name: "Outdoor",
    title: "Outdoor Headshots",
    description:
      "Natural light headshots with outdoor settings for a fresh, approachable professional look",
    keywords: ["outdoor headshot", "natural light headshot"],
    useCase:
      "Great for real estate agents, coaches, and professionals who want a more approachable, natural look",
  },
  {
    id: "casual",
    name: "Casual",
    title: "Casual Headshots",
    description:
      "Relaxed and modern headshots with casual styling for startups, tech professionals, and modern businesses",
    keywords: ["casual headshot", "modern headshot"],
    useCase:
      "Perfect for tech professionals, startup founders, and modern companies with casual dress codes",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    title: "LinkedIn Headshots",
    description:
      "Optimized headshots specifically designed for LinkedIn profiles to maximize visibility and engagement",
    keywords: ["linkedin headshot", "linkedin photo"],
    useCase:
      "Tailored for LinkedIn's dimensions and best practices to help you stand out on the platform",
  },
] as const;
export type Style = (typeof STYLES)[number];
