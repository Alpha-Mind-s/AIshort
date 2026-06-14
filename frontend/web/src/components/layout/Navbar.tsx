"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth/hooks";
import { Link } from "@/lib/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Navbar() {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  const navLinks = [
    { href: "/", label: t("home") },
    ...(isAuthenticated
      ? [
          { href: "/favorites", label: t("favorites") },
          { href: "/subscribe", label: t("subscribe") },
        ]
      : []),
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="AIshort" className="h-8 w-auto" />
            <span className="hidden sm:inline font-bold text-lg text-primary">AIshort</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />

            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-3">
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="text-sm font-medium text-primary hover:opacity-80 transition-opacity"
                  >
                    {t("admin")}
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {user?.nickname ?? t("profile")}
                </Link>
                <button
                  onClick={logout}
                  className="text-sm text-muted-foreground hover:text-destructive transition-colors"
                >
                  {t("logout")}
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("login")}
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  {t("register")}
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-1 text-muted-foreground hover:text-foreground"
              aria-label={tc("toggle_menu")}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "md:hidden border-t border-border bg-background transition-all",
          mobileOpen ? "block" : "hidden"
        )}
      >
        <div className="px-4 py-3 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-border pt-3">
            {isAuthenticated ? (
              <div className="space-y-2">
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="block text-sm font-medium text-primary"
                  >
                    {t("admin")}
                  </Link>
                )}
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm text-muted-foreground"
                >
                  {user?.nickname}
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                  className="block text-sm text-destructive"
                >
                  {t("logout")}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-medium"
                >
                  {t("login")}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-8 w-full items-center justify-center rounded-md bg-primary text-xs font-medium text-primary-foreground"
                >
                  {t("register")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
