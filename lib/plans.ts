export const PLANS = {
  basic: {
    id: "basic",
    name: "Basic Shoot",
    price: 29,
    amount: 2900,
    shots: 40,
    turnaround: "2 hours",
    resolution: "HD (1080p)",
    styles: "10+",
    backgrounds: "10+",
    popular: false,
    slug: "basic",
  },
  pro: {
    id: "pro",
    name: "Professional Shoot",
    price: 39,
    amount: 3900,
    shots: 100,
    turnaround: "1 hour",
    resolution: "Premium 4K",
    styles: "30+",
    backgrounds: "30+",
    popular: true,
    slug: "pro",
  },
  executive: {
    id: "executive",
    name: "Executive Shoot",
    price: 59,
    amount: 5900,
    shots: 200,
    turnaround: "30 minutes",
    resolution: "Ultra 8K",
    styles: "All styles",
    backgrounds: "50+",
    popular: false,
    slug: "executive",
  },
};

export const HEADSHOT_CATEGORIES = [
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "💼",
    description: "Perfect for your professional profile",
  },
  {
    id: "actor",
    name: "Actor Headshot",
    icon: "🎭",
    description: "Versatile looks for auditions",
  },
  {
    id: "corporate",
    name: "Corporate",
    icon: "🏢",
    description: "Executive presence for company pages",
  },
  {
    id: "creative",
    name: "Creative",
    icon: "🎨",
    description: "Stand out in creative industries",
  },
  {
    id: "casual",
    name: "Casual Professional",
    icon: "😊",
    description: "Approachable yet polished",
  },
  {
    id: "dating",
    name: "Dating & Social",
    icon: "🔥",
    description: "Flattering, natural, and confident",
  },
  {
    id: "model",
    name: "Modeling Portfolio",
    icon: "📸",
    description: "High-fashion and editorial looks",
  },
];

export const PLAN_SHOTS: Record<string, number> = {
  basic: 40,
  pro: 100,
  executive: 200,
  custom_upsell: 20,
};

export const STYLE_CATEGORIES = [
  {
    id: "corporate",
    name: "Corporate",
    description: "Suit-and-tie with office backgrounds",
    icon: "💼",
    promptKeywords: ["corporate", "executive", "leadership"],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    description: "Clean, approachable profile photos",
    icon: "🔗",
    promptKeywords: ["linkedin", "profile"],
  },
  {
    id: "creative",
    name: "Creative",
    description: "Artistic lighting and bold backgrounds",
    icon: "🎨",
    promptKeywords: ["creative", "editorial", "fashion"],
  },
  {
    id: "casual",
    name: "Casual",
    description: "Relaxed outdoor and natural settings",
    icon: "🌿",
    promptKeywords: ["casual", "outdoor", "park", "remote"],
  },
  {
    id: "startup",
    name: "Startup & Tech",
    description: "Modern coworking, smart casual",
    icon: "🚀",
    promptKeywords: ["startup", "founder", "tech"],
  },
  {
    id: "realestate",
    name: "Real Estate",
    description: "Trustworthy, client-facing headshots",
    icon: "🏠",
    promptKeywords: ["real-estate", "agent"],
  },
];

export const getPlanById = (id: string) => PLANS[id as keyof typeof PLANS];

export type PlanId = keyof typeof PLANS;
