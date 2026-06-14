"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-border bg-muted/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary mb-2">
              <img src="/logo.png" alt="AIshort" className="h-8 w-auto" />
              <span>AIshort</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              {t("tagline")}
            </p>
            <div className="mt-3">
              <LanguageSwitcher />
            </div>
          </div>

          {/* Links */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">{t("about")}</h4>
            <ul className="space-y-1">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t("about")}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t("contact")}
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">{t("legal")}</h4>
            <ul className="space-y-1">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t("terms")}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t("privacy")}
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">{t("download")}</h4>
            <ul className="space-y-1">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t("app_store")}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t("google_play")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">{t("copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
