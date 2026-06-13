"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { useRouter as useIntlRouter } from "@/lib/i18n/navigation";
import { getPlans, createSubscription, type SubscriptionPlan } from "@/lib/api/subscriptions";
import { formatCurrency } from "@/lib/utils/format";
import { useState } from "react";
import { ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { toast } from "sonner";

export default function CheckoutPage() {
  const t = useTranslations("subscribe");
  const searchParams = useSearchParams();
  const intlRouter = useIntlRouter();
  const planName = searchParams.get("plan") ?? "monthly";
  const [channel, setChannel] = useState<"stripe">("stripe");

  const { data: plans } = useQuery({
    queryKey: ["plans"],
    queryFn: getPlans,
  });

  const plan = plans?.find((p) => p.name === planName);

  const createMutation = useMutation({
    mutationFn: () =>
      createSubscription({
        plan_type: planName as SubscriptionPlan["name"],
        channel,
        return_url: `${window.location.origin}/en/profile`,
      }),
    onSuccess: (data) => {
      // In production, redirect to the payment URL
      toast.success("Redirecting to payment...");
      setTimeout(() => {
        window.location.href = data.payment_url;
      }, 1000);
    },
    onError: () => toast.error("Failed to create subscription"),
  });

  if (!plan) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Plan not found</p>
        <Link href="/subscribe" className="text-primary text-sm">
          Back to plans
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-12">
      {/* Back */}
      <Link
        href="/subscribe"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to plans
      </Link>

      {/* Selected plan summary */}
      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold capitalize">{plan.name} Plan</h2>
            <p className="text-sm text-muted-foreground">{plan.description}</p>
          </div>
          <span className="text-2xl font-bold">
            {formatCurrency(plan.price)}
          </span>
        </div>
        <ul className="mt-4 space-y-1">
          {plan.features.map((f, i) => (
            <li key={i} className="text-sm text-muted-foreground">✓ {f}</li>
          ))}
        </ul>
      </div>

      {/* Payment method */}
      <h3 className="text-lg font-semibold mb-3">{t("payment_method")}</h3>
      <div className="space-y-3 mb-6">
        {/* PayPal not yet implemented — see backend services/payment */}
        <label
          className={`flex items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-colors ${
            channel === "stripe"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          <input
            type="radio"
            name="channel"
            value="stripe"
            checked={channel === "stripe"}
            onChange={() => setChannel("stripe")}
            className="h-4 w-4 accent-primary"
          />
          <CreditCard className="h-5 w-5" />
          <span className="font-medium">{t("stripe")}</span>
        </label>
      </div>

      {/* Pay button */}
      <button
        onClick={() => createMutation.mutate()}
        disabled={createMutation.isPending}
        className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {createMutation.isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : null}
        Pay {formatCurrency(plan.price)}
      </button>
    </div>
  );
}
