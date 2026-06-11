export const mockSubscriptionPlans = [
  {
    id: 1,
    name: "monthly" as const,
    price: 9.99,
    currency: "USD",
    description: "Billed monthly. Cancel anytime.",
    features: [
      "Unlimited access to all dramas",
      "HD video quality",
      "1 device at a time",
      "AI subtitles in 5 languages",
    ],
  },
  {
    id: 2,
    name: "quarterly" as const,
    price: 24.99,
    currency: "USD",
    description: "Billed quarterly. Save 17%.",
    features: [
      "Everything in Monthly",
      "Full HD + 4K quality",
      "2 devices at a time",
      "Offline downloads",
      "Ad-free experience",
    ],
  },
  {
    id: 3,
    name: "yearly" as const,
    price: 79.99,
    currency: "USD",
    description: "Billed yearly. Save 33%.",
    features: [
      "Everything in Quarterly",
      "4 devices at a time",
      "Early access to new episodes",
      "Exclusive behind-the-scenes",
      "Priority customer support",
    ],
  },
];

export const mockSubscriptions = [
  {
    id: 1,
    user_id: 1,
    plan_type: "monthly" as const,
    start_at: "2026-06-01T00:00:00Z",
    end_at: "2026-07-01T00:00:00Z",
    status: "active" as const,
    auto_renew: true,
  },
];
