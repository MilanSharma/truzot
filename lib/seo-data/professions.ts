export const PROFESSIONS = [
  {
    id: "linkedin",
    name: "LinkedIn",
    title: "LinkedIn Headshots",
    description:
      "Professional headshots optimized for LinkedIn profiles to boost your visibility and credibility",
    keywords: ["linkedin headshot", "linkedin photo"],
    faq: [
      {
        q: "What makes a good LinkedIn headshot?",
        a: "A good LinkedIn headshot should be professional, well-lit, and show your face clearly.",
      },
    ],
  },
  {
    id: "resume",
    name: "Resume",
    title: "Resume Headshots",
    description:
      "Professional photos for resumes and CVs that make a strong first impression on recruiters",
    keywords: ["resume photo", "cv headshot"],
    faq: [
      {
        q: "Should I include a photo on my resume?",
        a: "While not always required in the US, a professional resume photo can help you stand out.",
      },
    ],
  },
  {
    id: "real-estate",
    name: "Real Estate Agent",
    title: "Real Estate Agent Headshots",
    description:
      "Trustworthy and approachable headshots for real estate agents to build client confidence",
    keywords: ["real estate agent headshot", "realtor photo"],
    faq: [
      {
        q: "Why do real estate agents need professional headshots?",
        a: "Real estate is a trust-based business. A professional headshot builds credibility.",
      },
    ],
  },
  {
    id: "acting",
    name: "Actor",
    title: "Actor Headshots",
    description:
      "Industry-standard actor headshots for casting calls, auditions, and talent profiles",
    keywords: ["actor headshot", "casting headshot"],
    faq: [
      {
        q: "What are the requirements for actor headshots?",
        a: "Actor headshots should be 8x10, show your face clearly, and capture your essence.",
      },
    ],
  },
  {
    id: "doctor",
    name: "Doctor",
    title: "Doctor Headshots",
    description:
      "Professional physician headshots for medical practices, hospital directories, and healthcare profiles",
    keywords: ["doctor headshot", "physician photo"],
    faq: [
      {
        q: "Why do doctors need professional headshots?",
        a: "Professional headshots build trust with patients and are required for hospital directories.",
      },
    ],
  },
  {
    id: "lawyer",
    name: "Lawyer",
    title: "Lawyer Headshots",
    description:
      "Professional attorney headshots for law firm websites, legal directories, and professional profiles",
    keywords: ["lawyer headshot", "attorney photo"],
    faq: [
      {
        q: "Why do lawyers need professional headshots?",
        a: "Professional headshots convey authority and trust, essential for client acquisition.",
      },
    ],
  },
  {
    id: "teacher",
    name: "Teacher",
    title: "Teacher Headshots",
    description:
      "Professional educator headshots for teachers, professors, and academic profiles",
    keywords: ["teacher headshot", "educator photo"],
    faq: [
      {
        q: "Why do teachers need professional headshots?",
        a: "Professional headshots build credibility with students, parents, and academic institutions.",
      },
    ],
  },
  {
    id: "real-estate-agent",
    name: "Real Estate Agent",
    title: "Real Estate Agent Headshots",
    description:
      "Trustworthy and approachable headshots for real estate agents to build client confidence",
    keywords: ["real estate agent headshot", "realtor photo"],
    faq: [
      {
        q: "Why do real estate agents need professional headshots?",
        a: "Real estate is a trust-based business. A professional headshot builds credibility.",
      },
    ],
  },
  {
    id: "actor",
    name: "Actor",
    title: "Actor Headshots",
    description:
      "Industry-standard actor headshots for casting calls, auditions, and talent profiles",
    keywords: ["actor headshot", "casting headshot"],
    faq: [
      {
        q: "What are the requirements for actor headshots?",
        a: "Actor headshots should be 8x10, show your face clearly, and capture your essence.",
      },
    ],
  },
] as const;
export type Profession = (typeof PROFESSIONS)[number];
