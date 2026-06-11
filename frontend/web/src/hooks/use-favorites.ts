"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { getFavorites, addFavorite, removeFavorite } from "@/lib/api/favorites";
import { toast } from "sonner";

export function useFavorites() {
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
      toast.success("Added to favorites");
    },
    onError: () => toast.error("Failed to add favorite"),
  });

  const removeMutation = useMutation({
    mutationFn: removeFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("Removed from favorites");
    },
    onError: () => toast.error("Failed to remove favorite"),
  });

  const toggleFavorite = (dramaId: number) => {
    if (!isAuthenticated) {
      toast.error("Please log in to add favorites");
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
