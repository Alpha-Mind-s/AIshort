"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth/hooks";
import { Link } from "@/lib/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useState, useEffect, useRef } from "react";
import { Menu, X, ChevronDown, User, Crown, LogOut } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Navbar() {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  // Scroll detection — shrink on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close user dropdown on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

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
    <nav
      className={cn(
        "sticky top-0 z-50 transition-all duration-300 ease-out",
        scrolled
          ? "bg-background/90 backdrop-blur-lg border-b border-border shadow-sm"
          : "bg-background/70 backdrop-blur-md border-b border-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div
          className={cn(
            "flex items-center justify-between transition-all duration-300",
            scrolled ? "h-12" : "h-14"
          )}
        >
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0"
          >
            <img
              src="/logo.png"
              alt="AIshort"
              className={cn(
                "w-auto transition-all duration-300",
                scrolled ? "h-7" : "h-8"
              )}
            />
            <span
              className={cn(
                "hidden sm:inline font-bold text-primary transition-all duration-300 tracking-tight",
                scrolled ? "text-base" : "text-lg"
              )}
            >
              AIshort
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />

            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-1">
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="px-3 py-1.5 text-sm font-medium text-primary hover:opacity-80 transition-opacity"
                  >
                    {t("admin")}
                  </Link>
                )}

                {/* User dropdown */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {/* Avatar */}
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.nickname}
                        className="h-7 w-7 rounded-full object-cover ring-1 ring-border"
                      />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">
                        {user?.nickname?.charAt(0).toUpperCase() ?? "U"}
                      </div>
                    )}
                    <span className="text-sm font-medium text-muted-foreground hidden lg:inline">
                      {user?.nickname ?? t("profile")}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                        userMenuOpen && "rotate-180"
                      )}
                    />
                  </button>

                  {/* Dropdown menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-border bg-card shadow-lg py-1 animate-fade-in origin-top-right">
                      <div className="px-3 py-2 border-b border-border">
                        <p className="text-sm font-medium truncate">{user?.nickname}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <User className="h-4 w-4" />
                        {t("profile")}
                      </Link>
                      {subscriptionActive && (
                        <Link
                          href="/subscribe"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        >
                          <Crown className="h-4 w-4" />
                          {t("subscribe")}
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-muted/50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        {t("logout")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("login")}
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground btn-glow"
                >
                  {t("register")}
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-1.5 -mr-1 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
              aria-label={tc("toggle_menu")}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer — slides from right */}
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileOpen(false)}
      />

      {/* Drawer panel */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-72 bg-card border-l border-border shadow-xl transition-transform duration-300 ease-out md:hidden",
          mobileOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b border-border">
          <span className="font-bold text-primary text-lg tracking-tight">AIshort</span>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="border-t border-border mx-4" />

        <div className="px-4 py-4">
          {isAuthenticated ? (
            <div className="space-y-1">
              {/* User info */}
              <div className="flex items-center gap-3 px-3 py-2 mb-2">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary">
                    {user?.nickname?.charAt(0).toUpperCase() ?? "U"}
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="text-sm font-medium truncate">{user?.nickname}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 text-sm font-medium text-primary hover:bg-muted/50 rounded-lg transition-colors"
                >
                  {t("admin")}
                </Link>
              )}
              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
              >
                {t("profile")}
              </Link>
              <Link
                href="/profile/settings"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
              >
                {t("settings")}
              </Link>
              <button
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-destructive hover:bg-muted/50 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                {t("logout")}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block w-full px-3 py-2.5 text-sm font-medium text-center text-foreground hover:bg-muted/50 rounded-lg transition-colors"
              >
                {t("login")}
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="block w-full py-2.5 text-sm font-semibold text-center text-primary-foreground bg-primary rounded-lg btn-glow"
              >
                {t("register")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

// Placeholder — in real usage this would come from a subscription status query.
// Kept as a simple flag to avoid importing the subscription API just for the dropdown link.
const subscriptionActive = false;
