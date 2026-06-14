"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/stores/auth-store";
import { Link } from "@/lib/i18n/navigation";
import { Send } from "lucide-react";

interface CommentFormProps {
  onSubmit: (content: string) => void;
  isSubmitting: boolean;
  replyTo?: string | null;
  onCancelReply?: () => void;
}

export function CommentForm({
  onSubmit,
  isSubmitting,
  replyTo,
  onCancelReply,
}: CommentFormProps) {
  const t = useTranslations("comment");
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [content, setContent] = useState("");

  if (!isAuthenticated) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
        <p className="text-sm text-muted-foreground mb-2">
          {t("sign_in_hint")}
        </p>
        <Link
          href="/login"
          className="text-sm font-medium text-primary hover:opacity-80"
        >
          {t("login_link")}
        </Link>
      </div>
    );
  }

  const handleSubmit = () => {
    if (!content.trim() || isSubmitting) return;
    onSubmit(content.trim());
    setContent("");
    onCancelReply?.();
  };

  return (
    <div className="space-y-2">
      {replyTo && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{t("replying_to", { name: replyTo })}</span>
          <button
            onClick={onCancelReply}
            className="text-xs text-destructive hover:underline"
          >
            {t("cancel")}
          </button>
        </div>
      )}
      <div className="flex gap-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={replyTo ? t("reply_placeholder") : t("placeholder")}
          rows={3}
          maxLength={2000}
          className="flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          className="self-end flex-shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
      <p className="text-xs text-muted-foreground text-right">
        {content.length}/2000 {t("char_count")} · {t("submit_hint")}
      </p>
    </div>
  );
}
