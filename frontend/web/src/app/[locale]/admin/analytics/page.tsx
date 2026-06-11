"use client";

import { useTranslations } from "next-intl";
import { BarChart3, TrendingUp, Globe } from "lucide-react";

export default function AdminAnalyticsPage() {
  const t = useTranslations("admin");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("analytics")}</h1>

      {/* Charts placeholder — Recharts integration in polish phase */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Daily Views (7 days)</h3>
          </div>
          {/* ASCII chart placeholder */}
          <div className="flex items-end gap-1 h-40">
            {[35, 42, 38, 48, 52, 47, 58].map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">{v}K</span>
                <div
                  className="w-full bg-primary/60 rounded-t"
                  style={{ height: `${v * 0.6}%` }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-green-500" />
            <h3 className="font-semibold">Views by Region</h3>
          </div>
          <div className="space-y-3">
            {[
              { region: "United States", pct: 38 },
              { region: "Brazil", pct: 22 },
              { region: "Mexico", pct: 15 },
              { region: "Japan", pct: 12 },
              { region: "Others", pct: 13 },
            ].map((item) => (
              <div key={item.region} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{item.region}</span>
                  <span className="font-medium">{item.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-green-500"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-purple-500" />
            <h3 className="font-semibold">Top Categories</h3>
          </div>
          <div className="space-y-3">
            {[
              { name: "Romance", views: 125000 },
              { name: "Action", views: 98000 },
              { name: "Fantasy", views: 82000 },
              { name: "Comedy", views: 71000 },
              { name: "Thriller", views: 54000 },
            ].map((cat, i) => (
              <div key={cat.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="text-lg font-bold text-muted-foreground">#{i + 1}</span>
                  {cat.name}
                </span>
                <span className="font-medium text-muted-foreground">
                  {(cat.views / 1000).toFixed(0)}K
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
