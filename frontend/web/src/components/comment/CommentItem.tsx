"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/stores/auth-store";
import { ThumbsUp, Reply, Trash2 } from "lucide-react";
import { timeAgo } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Comment } from "@/lib/api/comments";
import { CommentForm } from "./CommentForm";

interface CommentItemProps {
  comment: Comment;
  onLike: (id: number) => void;
  onDelete: (id: number) => void;
  onReply: (content: string, parentId: number) => void;
  isAddingReply: boolean;
  depth?: number;
  /** Nickname of the parent comment author (TikTok-style flat display) */
  parentNickname?: string;
}

export function CommentItem({
  comment,
  onLike,
  onDelete,
  onReply,
  isAddingReply,
  depth = 0,
  parentNickname,
}: CommentItemProps) {
  const t = useTranslations("comment");
  const user = useAuthStore((s) => s.user);
  const [showReply, setShowReply] = useState(false);
  const isOwner = user?.id === comment.user?.id;

  // Find child comments (replies)
  const hasReplies = false; // Simplified — real API would have `replies` field

  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
          {comment.user?.nickname?.charAt(0) ?? '?'}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              {comment.user?.nickname ?? 'Anonymous'}
            </span>
            {/* TikTok-style reply badge */}
            {parentNickname && (
              <span className="text-xs text-primary">
                {t("reply_to", { name: parentNickname })}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {timeAgo(comment.created_at)}
            </span>
          </div>
          <p className="text-sm mt-1 whitespace-pre-wrap break-words">
            {comment.content}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => onLike(comment.id)}
              className={cn(
                "flex items-center gap-1 text-xs hover:text-primary transition-colors",
                comment.is_liked ? "text-primary" : "text-muted-foreground"
              )}
            >
              <ThumbsUp className="h-3 w-3" />
              {comment.likes_count > 0 && comment.likes_count}
            </button>
            <button
              onClick={() => setShowReply(!showReply)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Reply className="h-3 w-3" />
              {t("reply")}
            </button>
            {isOwner && (
              <button
                onClick={() => onDelete(comment.id)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Reply form */}
          {showReply && (
            <div className="mt-3">
              <CommentForm
                onSubmit={(content) => {
                  onReply(content, comment.id);
                  setShowReply(false);
                }}
                isSubmitting={isAddingReply}
                replyTo={comment.user?.nickname ?? 'Anonymous'}
                onCancelReply={() => setShowReply(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
