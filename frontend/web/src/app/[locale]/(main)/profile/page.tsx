"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/stores/auth-store";
import { useAuth } from "@/lib/auth/hooks";
import { getSubscriptionStatus, cancelSubscription } from "@/lib/api/subscriptions";
import { updateProfile } from "@/lib/api/users";
import { formatDate } from "@/lib/utils/format";
import { Link } from "@/lib/i18n/navigation";
import { useRouter, usePathname } from "@/lib/i18n/navigation";
import { LOCALES } from "@/lib/utils/constants";
import { AvatarUploader } from "@/components/profile/AvatarUploader";
import { Settings, LogOut, Crown, Calendar, CreditCard, Edit3, X, Loader2, User } from "lucide-react";
import { toast } from "sonner";

const FLAGS: Record<string, string> = {
  en: "US", es: "ES", pt: "BR", ja: "JP", ko: "KR",
};

export default function ProfilePage() {
  const t = useTranslations("profile");
  const user = useAuthStore((s) => s.user);
  const storeUpdateUser = useAuthStore((s) => s.updateUser);
  const { logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ["subscription-status"],
    queryFn: getSubscriptionStatus,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => toast.success(t("toast.subscription_cancelled")),
    onError: () => toast.error(t("toast.cancel_failed")),
  });

  // ---- edit mode state ----
  const [isEditing, setIsEditing] = useState(false);
  const [formNickname, setFormNickname] = useState("");
  const [formLanguage, setFormLanguage] = useState("");
  const [formRegion, setFormRegion] = useState("");
  const [formAvatarUrl, setFormAvatarUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const saveMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updatedUser) => {
      storeUpdateUser(updatedUser);
      toast.success(t("profile_updated"));
      setIsEditing(false);

      if (updatedUser.language && updatedUser.language !== user?.language) {
        router.replace(pathname, { locale: updatedUser.language });
      }
    },
    onError: () => {
      toast.error(t("toast.update_failed"));
    },
  });

  // ---- helpers ----
  const enterEditMode = () => {
    if (!user) return;
    setFormNickname(user.nickname);
    setFormLanguage(user.language || "en");
    setFormRegion(user.region || "US");
    setFormAvatarUrl(user.avatar_url || "");
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setIsUploading(false);
  };

  const handleSave = () => {
    saveMutation.mutate({
      nickname: formNickname || undefined,
      avatar_url: formAvatarUrl || undefined,
      language: formLanguage || undefined,
      region: formRegion || undefined,
    });
  };

  const statusLabels: Record<string, string> = {
    active: t("subscription.status_active"),
    cancelled: t("subscription.status_cancelled"),
    expired: t("subscription.status_expired"),
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="h-20 w-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
          <User className="h-10 w-10 text-muted-foreground/40" />
        </div>
        <p className="text-muted-foreground mb-4">{t("not_logged_in")}</p>
        <Link
          href="/login"
          className="inline-flex items-center rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground btn-glow"
        >
          {t("login")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-8 animate-fade-in">
      {/* Profile header */}
      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          {isEditing ? (
            <AvatarUploader
              value={formAvatarUrl}
              onChange={setFormAvatarUrl}
              nickname={formNickname || user.nickname}
              onUploading={setIsUploading}
            />
          ) : user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.nickname}
              className="h-16 w-16 rounded-full object-cover ring-2 ring-border"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary ring-2 ring-primary/20">
              {user.nickname.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={formNickname}
                  onChange={(e) => setFormNickname(e.target.value)}
                  maxLength={100}
                  placeholder={t("nickname_label")}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
                />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight">{user.nickname}</h1>
                  <button
                    onClick={enterEditMode}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors rounded-lg px-2.5 py-1 hover:bg-muted/50"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    {t("edit_profile")}
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {t("member_since")} {formatDate(user.created_at)}
                </p>
              </>
            )}
          </div>

          {isEditing && (
            <button
              onClick={cancelEdit}
              className="shrink-0 p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Language & Region — edit mode only */}
        {isEditing && (
          <div className="mt-6 pt-6 border-t border-border space-y-5">
            {/* Language */}
            <div>
              <label className="block text-sm font-medium mb-2.5">{t("language")}</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {LOCALES.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setFormLanguage(loc)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      formLanguage === loc
                        ? "border-primary bg-primary/5 text-primary shadow-sm"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <span className="text-base">{FLAGS[loc]}</span>
                    <span className="text-xs">{loc.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("region")}</label>
              <select
                value={formRegion}
                onChange={(e) => setFormRegion(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
              >
                <option value="US">United States</option>
                <option value="ES">España</option>
                <option value="BR">Brasil</option>
                <option value="JP">日本</option>
                <option value="KR">한국</option>
                <option value="GB">United Kingdom</option>
                <option value="FR">France</option>
                <option value="DE">Deutschland</option>
                <option value="MX">México</option>
              </select>
            </div>
          </div>
        )}
      </section>

      {/* Account info — edit mode only */}
      {isEditing && (
        <section className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-bold tracking-tight">{t("account")}</h2>
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                {t("email_label")}
              </p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                {t("role_label")}
              </p>
              <p className="font-medium capitalize">{user.role}</p>
            </div>
          </div>
        </section>
      )}

      {/* Subscription status */}
      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-yellow-500/10 flex items-center justify-center">
            <Crown className="h-5 w-5 text-yellow-500" />
          </div>
          <h2 className="text-lg font-bold tracking-tight">{t("my_subscription")}</h2>
        </div>

        {subLoading ? (
          <div className="space-y-3">
            <div className="h-5 bg-muted rounded-md animate-shimmer w-2/3" />
            <div className="h-4 bg-muted rounded-md animate-shimmer w-1/3" />
          </div>
        ) : subscription ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {formatDate(subscription.start_at)} — {formatDate(subscription.end_at)}
                  </span>
                </span>
                <span
                  className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${
                    subscription.status === "active"
                      ? "bg-success/10 text-success"
                      : "bg-yellow-500/10 text-yellow-600"
                  }`}
                >
                  {statusLabels[subscription.status] ?? subscription.status}
                </span>
              </div>
              <span className="text-sm font-semibold capitalize flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                {subscription.plan_type}
              </span>
            </div>
            {subscription.status === "active" && (
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="text-sm font-medium text-destructive hover:underline disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {cancelMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {t("subscription.cancel")}
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-4">{t("no_subscription")}</p>
            <Link
              href="/subscribe"
              className="inline-flex items-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground btn-glow"
            >
              {t("subscribe_now")}
            </Link>
          </div>
        )}
      </section>

      {/* Save / Cancel — edit mode */}
      {isEditing && (
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={isUploading || saveMutation.isPending}
            className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground btn-glow disabled:opacity-50 transition-opacity"
          >
            {saveMutation.isPending
              ? t("saving")
              : t("save")}
          </button>
          <button
            onClick={cancelEdit}
            disabled={saveMutation.isPending}
            className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            {t("cancel_edit")}
          </button>
        </div>
      )}

      {/* Actions — read-only mode */}
      {!isEditing && (
        <div className="space-y-2">
          <Link
            href="/profile/settings"
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
              <Settings className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium">{t("settings")}</span>
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full rounded-xl border border-border bg-card p-4 hover:bg-muted/50 transition-colors text-left"
          >
            <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center">
              <LogOut className="h-5 w-5 text-destructive" />
            </div>
            <span className="text-sm font-medium">{t("log_out")}</span>
          </button>
        </div>
      )}
    </div>
  );
}
