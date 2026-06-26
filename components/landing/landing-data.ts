export const navigationLinks = [
  { label: "Home", href: "/" },
  { label: "Problem", href: "#problem" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Comparison", href: "#comparison" },
  { label: "Proof", href: "#proof" },
  { label: "FAQ", href: "#faq" },
];

export const pricingSignal = ["Good €9/mo", "Better €19/mo"];

export const plans = [
  {
    name: "Good",
    description: "For solo builders posting a few strong updates each month.",
    price: "€9/mo",
    features: [
      "1 repo",
      "20 published tweets / month",
      "100 drafts generated / month",
    ],
  },
  {
    name: "Better",
    badge: "Best for consistent builders",
    description:
      "For founders who ship often and want every meaningful update covered.",
    price: "€19/mo",
    features: [
      "Up to 5 repos",
      "60 published tweets / month",
      "300 drafts generated / month",
    ],
  },
];

export const faqItems = [
  {
    question: "Does Dispatch post automatically?",
    answer:
      "No. Dispatch creates the draft. You review it, edit if needed, and decide when to post.",
  },
  {
    question: "Is this just a ChatGPT wrapper?",
    answer:
      "No. Dispatch starts with your GitHub commit, pulls the context, finds the build-in-public angle, and gives you post-ready variants.",
  },
  {
    question: "Do I need a content calendar?",
    answer:
      "No. Dispatch is built around your actual shipping rhythm, not a separate posting schedule.",
  },
  {
    question: "Is there a free plan?",
    answer:
      "No. Dispatch is paid from day one so the product can stay focused on people who are actively building and posting.",
  },
];

export const legalLinks = [
  { label: "Legal notice", href: "/impressum" },
  { label: "Privacy policy", href: "/datenschutz" },
];
