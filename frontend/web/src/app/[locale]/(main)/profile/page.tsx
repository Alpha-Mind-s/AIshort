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
import { Settings, LogOut, Crown, Calendar, CreditCard, Edit3, X } from "lucide-react";
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

      // If language changed, navigate to the new locale
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
    active: t("subscription.status_active") as unknown as string,
    cancelled: t("subscription.status_cancelled") as unknown as string,
    expired: t("subscription.status_expired") as unknown as string,
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">{t("not_logged_in")}</p>
        <Link href="/login" className="text-primary text-sm">
          {t("login")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      {/* Profile header */}
      <div className="flex items-center gap-4">
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
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
            {user.nickname.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={formNickname}
                onChange={(e) => setFormNickname(e.target.value)}
                maxLength={100}
                placeholder={t("nickname_label") as unknown as string}
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{user.nickname}</h1>
                <button
                  onClick={enterEditMode}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  {t("edit_profile") as unknown as string}
                </button>
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("member_since")} {formatDate(user.created_at)}
              </p>
            </>
          )}
        </div>
        {isEditing && (
          <button
            onClick={cancelEdit}
            className="self-start p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Language & Region — editable in edit mode */}
      {isEditing && (
        <section className="rounded-xl border border-border bg-card p-6 space-y-4">
          {/* Language */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("language") as unknown as string}</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {LOCALES.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setFormLanguage(loc)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    formLanguage === loc
                      ? "border-primary bg-primary/5 font-medium text-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <span>{FLAGS[loc]}</span>
                  {loc.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Region */}
          <div>
            <label className="block text-sm font-medium mb-1">{t("region") as unknown as string}</label>
            <select
              value={formRegion}
              onChange={(e) => setFormRegion(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
        </section>
      )}

      {/* Edit mode: email + role (read-only) */}
      {isEditing && (
        <section className="rounded-xl border border-border bg-card p-6 space-y-3">
          <h2 className="text-lg font-semibold">{t("account")}</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">{t("email_label")}</span>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t("role_label")}</span>
              <p className="font-medium capitalize">{user.role}</p>
            </div>
          </div>
        </section>
      )}

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
              {t("no_subscription")}
            </p>
            <Link
              href="/subscribe"
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              {t("subscribe_now")}
            </Link>
          </div>
        )}
      </section>

      {/* Edit mode: Save / Cancel buttons */}
      {isEditing && (
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={isUploading || saveMutation.isPending}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saveMutation.isPending ? (t("saving") as unknown as string) : (t("save") as unknown as string)}
          </button>
          <button
            onClick={cancelEdit}
            disabled={saveMutation.isPending}
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            {t("cancel_edit") as unknown as string}
          </button>
        </div>
      )}

      {/* Actions — only show in read-only mode */}
      {!isEditing && (
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
            <span className="text-sm font-medium">{t("log_out")}</span>
          </button>
        </div>
      )}
    </div>
  );
}
