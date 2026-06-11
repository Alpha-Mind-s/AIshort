"use client";

import { useTranslations } from "next-intl";
import { Users, Play, DollarSign, TrendingUp } from "lucide-react";

const STATS = [
  { key: "total_users", value: "12,847", icon: Users, change: "+12%", color: "text-blue-500" },
  { key: "total_dramas", value: "156", icon: Play, change: "+8%", color: "text-purple-500" },
  { key: "daily_views", value: "48.2K", icon: TrendingUp, change: "+23%", color: "text-green-500" },
  { key: "revenue", value: "$24,892", icon: DollarSign, change: "+18%", color: "text-yellow-500" },
];

export default function AdminDashboardPage() {
  const t = useTranslations("admin");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("dashboard")}</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.key}
              className="rounded-xl border border-border bg-card p-5 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t(stat.key)}
                </span>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{stat.value}</span>
                <span className="text-xs text-green-600 font-medium">
                  {stat.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick links */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold mb-3">Recent Activity</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• New user registered: user_12k</p>
            <p>• Drama &quot;Love in the Rain&quot; hit 100K views</p>
            <p>• Payment received: $79.99 (yearly plan)</p>
            <p>• Content flag reviewed: 3 items</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold mb-3">System Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">API</span>
              <span className="text-green-600 font-medium">Operational</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CDN</span>
              <span className="text-green-600 font-medium">Operational</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">AI Pipeline</span>
              <span className="text-yellow-600 font-medium">Degraded</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Storage</span>
              <span className="text-green-600 font-medium">98% available</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
