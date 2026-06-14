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
        "relative rounded-2xl border-2 p-6 sm:p-8 transition-all duration-300 hover:shadow-lg flex flex-col",
        isPopular
          ? "border-primary shadow-md scale-[1.02] bg-card"
          : "border-border hover:border-primary/40 bg-card/50"
      )}
    >
      {/* Popular badge — pill on top */}
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-5 py-1.5 text-xs font-bold text-primary-foreground flex items-center gap-1.5 shadow-md">
          <Star className="h-3.5 w-3.5" fill="currentColor" />
          {t("popular")}
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="text-lg font-bold capitalize">{t(plan.name)}</h3>
        <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
        <div className="mt-4 flex items-baseline justify-center gap-1">
          <span className="text-4xl font-extrabold tracking-tight">
            {formatCurrency(plan.price)}
          </span>
          <span className="text-sm text-muted-foreground">{t("per_month")}</span>
        </div>
        {discountMap[plan.name] > 0 && (
          <p className="text-xs font-semibold text-success mt-2">
            {t("save", { discount: discountMap[plan.name] })}
          </p>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-8 flex-1">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3 text-sm">
            <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
            <span className="text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={() => onSelect(plan)}
        disabled={isCurrent}
        className={cn(
          "w-full rounded-xl py-3 text-sm font-semibold transition-all duration-200",
          isCurrent
            ? "bg-muted text-muted-foreground cursor-default"
            : isPopular
            ? "bg-primary text-primary-foreground btn-glow"
            : "bg-muted text-foreground hover:bg-muted/80 hover:-translate-y-0.5"
        )}
      >
        {isCurrent
          ? t("current_plan")
          : t(`cta_${plan.name}`)}
      </button>
    </div>
  );
}
