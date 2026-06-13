"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/stores/auth-store";
import { useAuth } from "@/lib/auth/hooks";
import { getSubscriptionStatus, cancelSubscription, type Subscription } from "@/lib/api/subscriptions";
import { formatDate } from "@/lib/utils/format";
import { Link } from "@/lib/i18n/navigation";
import { Settings, LogOut, Crown, Calendar, CreditCard } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();

  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ["subscription-status"],
    queryFn: getSubscriptionStatus,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => toast.success("Subscription cancelled"),
    onError: () => toast.error("Failed to cancel"),
  });

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Please log in to view your profile.</p>
        <Link href="/login" className="text-primary text-sm">
          Log in
        </Link>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    active: t("subscription.status_active") as unknown as string,
    cancelled: t("subscription.status_cancelled") as unknown as string,
    expired: t("subscription.status_expired") as unknown as string,
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      {/* Profile header */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold">
          {user.nickname.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{user.nickname}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {t("member_since")} {formatDate(user.created_at)}
          </p>
        </div>
      </div>

      {/* Subscription status */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          <h2 className="text-lg font-semibold">{t("my_subscription")}</h2>
        </div>

        {subLoading ? (
          <div className="h-16 bg-muted animate-pulse rounded" />
        ) : subscription ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {formatDate(subscription.start_at)} — {formatDate(subscription.end_at)}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  subscription.status === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}>
                  {statusLabels[subscription.status] ?? subscription.status}
                </span>
              </div>
              <span className="text-sm font-medium capitalize flex items-center gap-1">
                <CreditCard className="h-4 w-4" />
                {subscription.plan_type}
              </span>
            </div>
            {subscription.status === "active" && (
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="text-sm text-destructive hover:underline"
              >
                {t("subscription.cancel") as unknown as string}
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              No active subscription
            </p>
            <Link
              href="/subscribe"
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Subscribe Now
            </Link>
          </div>
        )}
      </section>

      {/* Actions */}
      <div className="space-y-2">
        <Link
          href="/profile/settings"
          className="flex items-center gap-3 rounded-lg border border-border p-4 hover:bg-muted transition-colors"
        >
          <Settings className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">{t("settings")}</span>
        </Link>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full rounded-lg border border-border p-4 hover:bg-muted transition-colors text-left"
        >
          <LogOut className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">Log out</span>
        </button>
      </div>
    </div>
  );
}
