"use client";

import { useTranslations } from "next-intl";
import { useAuthStore } from "@/stores/auth-store";
import { usePathname } from "@/lib/i18n/navigation";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard,
  Users,
  FileCheck,
  BarChart3,
  ArrowLeft,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/admin", label: "dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "users", icon: Users },
  { href: "/admin/content", label: "content", icon: FileCheck },
  { href: "/admin/analytics", label: "analytics", icon: BarChart3 },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("admin");
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You need admin privileges to view this page.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-primary hover:opacity-80"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-56 bg-card border-r border-border flex flex-col transition-transform lg:relative lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-primary text-sm"
          >
            <img src="/logo.png" alt="AIshort" className="h-5 w-auto" /> AIshort Admin
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 hover:bg-muted rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {t(item.label)}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-border bg-background/95 backdrop-blur">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-1 hover:bg-muted rounded"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium text-muted-foreground">
            Welcome, {user?.nickname}
          </span>
        </header>
        <main className="flex-1 p-4 md:p-6 bg-muted/20">{children}</main>
      </div>
    </div>
  );
}
