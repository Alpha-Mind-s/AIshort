"use client";

import { useParams } from "next/navigation";
import { mockUsers } from "@/lib/mocks/data/users";
import { formatDate } from "@/lib/utils/format";
import { Link } from "@/lib/i18n/navigation";
import { ArrowLeft } from "lucide-react";

export default function AdminUserDetailPage() {
  const params = useParams();
  const user = mockUsers.find((u) => u.id === Number(params.id));

  if (!user) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-muted-foreground">User not found</p>
        <Link href="/admin/users" className="text-primary text-sm">
          Back to users
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to users
      </Link>

      <div className="flex items-center gap-4">
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.nickname}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold">
            {user.nickname.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{user.nickname}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {[
          ["Role", user.role],
          ["Region", user.region],
          ["Language", user.language],
          ["OAuth Provider", user.oauth_provider ?? "Email"],
          ["Joined", formatDate(user.created_at)],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-border bg-card p-4"
          >
            <span className="text-xs text-muted-foreground">{label}</span>
            <p className="font-medium mt-1 capitalize">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
