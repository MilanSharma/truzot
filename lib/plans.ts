export const PLANS = {
  basic: {
    id: 'basic',
    name: 'Basic Shoot',
    price: 29,
    shots: 40,
    turnaround: '2 hours',
    resolution: 'HD (1080p)',
    styles: '10+',
    backgrounds: '10+',
    popular: false,
    slug: 'basic'
  },
  pro: {
    id: 'pro',
    name: 'Professional Shoot',
    price: 39,
    shots: 100,
    turnaround: '1 hour',
    resolution: 'Premium 4K',
    styles: '30+',
    backgrounds: '30+',
    popular: true,
    slug: 'pro'
  },
  executive: {
    id: 'executive',
    name: 'Executive Shoot',
    price: 59,
    shots: 200,
    turnaround: '30 minutes',
    resolution: 'Ultra 8K',
    styles: 'All styles',
    backgrounds: '50+',
    popular: false,
    slug: 'executive'
  }
};

export const HEADSHOT_CATEGORIES = [
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', description: 'Perfect for your professional profile' },
  { id: 'actor', name: 'Actor Headshot', icon: '🎭', description: 'Versatile looks for auditions' },
  { id: 'corporate', name: 'Corporate', icon: '🏢', description: 'Executive presence for company pages' },
  { id: 'creative', name: 'Creative', icon: '🎨', description: 'Stand out in creative industries' },
  { id: 'casual', name: 'Casual Professional', icon: '😊', description: 'Approachable yet polished' }
];

export const getPlanById = (id: string) => PLANS[id as keyof typeof PLANS];
