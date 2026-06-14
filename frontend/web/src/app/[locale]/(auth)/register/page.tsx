import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

export default function RegisterPage() {
  const t = useTranslations("auth");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{t("register_title")}</h1>
        <p className="text-sm text-muted-foreground">{t("register_subtitle")}</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <RegisterForm />
      </div>

      <OAuthButtons />

      <p className="text-center text-sm text-muted-foreground">
        {t("has_account")}{" "}
        <Link
          href="/login"
          className="font-semibold text-primary hover:opacity-80 transition-opacity"
        >
          {t("submit_login")}
        </Link>
      </p>
    </div>
  );
}
