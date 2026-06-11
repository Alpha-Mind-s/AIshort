"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getComments, createComment, deleteComment, likeComment } from "@/lib/api/comments";
import { toast } from "sonner";
import { useState } from "react";

export function useComments(dramaId: number) {
  const queryClient = useQueryClient();
  const [sort, setSort] = useState<"latest" | "hottest">("latest");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["comments", dramaId, sort, page],
    queryFn: () => getComments(dramaId, sort, page, 20),
    staleTime: 10_000,
  });

  const comments = data?.data ?? [];
  const meta = data?.meta;

  const addMutation = useMutation({
    mutationFn: (content: string) =>
      createComment(dramaId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", dramaId] });
      toast.success("Comment posted");
    },
    onError: () => toast.error("Failed to post comment"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", dramaId] });
      toast.success("Comment deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });

  const likeMutation = useMutation({
    mutationFn: likeComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", dramaId] });
    },
  });

  const loadMore = () => {
    if (meta && page * meta.page_size < meta.total) {
      setPage((p) => p + 1);
    }
  };

  return {
    comments,
    isLoading,
    sort,
    setSort: (s: "latest" | "hottest") => { setSort(s); setPage(1); },
    addComment: addMutation.mutate,
    isAdding: addMutation.isPending,
    deleteComment: deleteMutation.mutate,
    likeComment: likeMutation.mutate,
    hasMore: meta ? page * meta.page_size < meta.total : false,
    loadMore,
  };
}
