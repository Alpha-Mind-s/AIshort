"use client";

import { useTranslations } from "next-intl";
import { Check, Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/format";
import type { SubscriptionPlan } from "@/lib/api/subscriptions";

interface PlanCardProps {
  plan: SubscriptionPlan;
  isPopular?: boolean;
  isCurrent?: boolean;
  onSelect: (plan: SubscriptionPlan) => void;
}

export function PlanCard({
  plan,
  isPopular,
  isCurrent,
  onSelect,
}: PlanCardProps) {
  const t = useTranslations("subscribe");

  const discountMap: Record<string, number> = {
    monthly: 0,
    quarterly: 17,
    yearly: 33,
  };

  return (
    <div
      className={cn(
        "relative rounded-xl border-2 p-6 transition-all hover:shadow-lg flex flex-col",
        isPopular
          ? "border-primary shadow-md scale-[1.02]"
          : "border-border hover:border-primary/50"
      )}
    >
      {/* Popular badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground flex items-center gap-1">
          <Star className="h-3 w-3" fill="currentColor" />
          {t("popular")}
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold capitalize">{t(plan.name)}</h3>
        <div className="mt-2 flex items-baseline justify-center gap-1">
          <span className="text-3xl font-bold">
            {formatCurrency(plan.price)}
          </span>
          <span className="text-sm text-muted-foreground">{t("per_month")}</span>
        </div>
        {discountMap[plan.name] > 0 && (
          <p className="text-xs text-green-600 mt-1">
            {t("save", { discount: discountMap[plan.name] })}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
      </div>

      {/* Features */}
      <ul className="space-y-2.5 mb-6 flex-1">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={() => onSelect(plan)}
        disabled={isCurrent}
        className={cn(
          "w-full rounded-lg py-2.5 text-sm font-semibold transition-all",
          isCurrent
            ? "bg-muted text-muted-foreground cursor-default"
            : isPopular
            ? "bg-primary text-primary-foreground hover:opacity-90"
            : "bg-muted text-foreground hover:bg-muted/80"
        )}
      >
        {isCurrent
          ? t("current_plan")
          : t(`cta_${plan.name}` as keyof typeof t extends never ? never : "cta_monthly")}
      </button>
    </div>
  );
}
