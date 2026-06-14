"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { getFavorites, addFavorite, removeFavorite } from "@/lib/api/favorites";
import { toast } from "sonner";

export interface FavoritesToastMessages {
  added: string;
  addFailed: string;
  removed: string;
  removeFailed: string;
  loginRequired: string;
}

export function useFavorites(tMessages?: FavoritesToastMessages) {
  const msg = tMessages ?? {
    added: "Added to favorites",
    addFailed: "Failed to add favorite",
    removed: "Removed from favorites",
    removeFailed: "Failed to remove favorite",
    loginRequired: "Please log in to add favorites",
  };

  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data, isLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => getFavorites(1, 100),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const favorites = data?.data ?? [];

  const isFavorited = (dramaId: number) =>
    favorites.some((f) => f.drama_id === dramaId);

  const getFavoriteId = (dramaId: number) =>
    favorites.find((f) => f.drama_id === dramaId)?.id;

  const addMutation = useMutation({
    mutationFn: addFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success(msg.added);
    },
    onError: () => toast.error(msg.addFailed),
  });

  const removeMutation = useMutation({
    mutationFn: removeFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success(msg.removed);
    },
    onError: () => toast.error(msg.removeFailed),
  });

  const toggleFavorite = (dramaId: number) => {
    if (!isAuthenticated) {
      toast.error(msg.loginRequired);
      return;
    }
    if (isFavorited(dramaId)) {
      const fid = getFavoriteId(dramaId);
      if (fid) removeMutation.mutate(fid);
    } else {
      addMutation.mutate(dramaId);
    }
  };

  return {
    favorites,
    isLoading,
    isFavorited,
    toggleFavorite,
    isToggling: addMutation.isPending || removeMutation.isPending,
  };
}
