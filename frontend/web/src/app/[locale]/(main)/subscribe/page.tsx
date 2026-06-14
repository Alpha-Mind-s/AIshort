"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/i18n/navigation";
import { getPlans } from "@/lib/api/subscriptions";
import { PlanCard } from "@/components/subscription/PlanCard";
import type { SubscriptionPlan } from "@/lib/api/subscriptions";

export default function SubscribePage() {
  const t = useTranslations("subscribe");
  const router = useRouter();

  const { data: plans, isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: getPlans,
  });

  const handleSelect = (plan: SubscriptionPlan) => {
    router.push(`/subscribe/checkout?plan=${plan.name}`);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        {/* Header */}
        <div className="text-center mb-14 space-y-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto text-base leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Plans grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[420px] rounded-2xl bg-card animate-shimmer" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto items-start animate-fade-in">
            {(plans ?? []).map((plan, i) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isPopular={i === 1}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
