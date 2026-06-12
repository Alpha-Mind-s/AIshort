"use client";

import { useTranslations } from "next-intl";
import { useComments } from "@/hooks/use-comments";
import { CommentForm } from "./CommentForm";
import { CommentItem } from "./CommentItem";
import { Loader2 } from "lucide-react";

interface CommentSectionProps {
  dramaId: number;
}

export function CommentSection({ dramaId }: CommentSectionProps) {
  const t = useTranslations("comment");
  const {
    comments,
    isLoading,
    sort,
    setSort,
    addComment,
    isAdding,
    deleteComment,
    likeComment,
    hasMore,
    loadMore,
  } = useComments(dramaId);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold">{t("title")} ({comments.length})</h3>

      {/* Comment form */}
      <CommentForm
        onSubmit={(content) => addComment(content)}
        isSubmitting={isAdding}
      />

      {/* Sort toggle */}
      {comments.length > 0 && (
        <div className="flex items-center gap-3 text-sm">
          <button
            onClick={() => setSort("latest")}
            className={`font-medium transition-colors ${
              sort === "latest" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("sort_latest")}
          </button>
          <button
            onClick={() => setSort("hottest")}
            className={`font-medium transition-colors ${
              sort === "hottest" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("sort_hottest")}
          </button>
        </div>
      )}

      {/* Comments list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center py-8 text-sm text-muted-foreground">
          No comments yet. Be the first to share your thoughts!
        </p>
      ) : (
        <div className="space-y-3">
          {/* TikTok-style flat comment list: no nesting, replies show "回复 @username" */}
          {(() => {
            const commentMap = new Map(comments.map((c) => [c.id, c]));
            return (
              <>
                {comments.map((comment) => {
                  const parentComment = comment.parent_id
                    ? commentMap.get(comment.parent_id)
                    : undefined;
                  return (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      parentNickname={parentComment?.user?.nickname}
                      onLike={likeComment}
                      onDelete={deleteComment}
                      onReply={(content, parentId) =>
                        addComment(content, parentId)
                      }
                      isAddingReply={isAdding}
                    />
                  );
                })}
                {/* Load more */}
                {hasMore && (
                  <button
                    onClick={loadMore}
                    className="w-full py-2 text-sm text-primary hover:opacity-80 transition-opacity"
                  >
                    {t("load_more")}
                  </button>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
