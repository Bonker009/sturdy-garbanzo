import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Reward } from "@/app/page";

const REWARDS_TAG = ["rewards"] as const;

async function fetchRewards(): Promise<Reward[]> {
  const response = await fetch("/api/rewards");
  const data = await response.json();
  return data.rewards || [];
}

export function useRewards() {
  return useQuery({
    queryKey: REWARDS_TAG,
    queryFn: fetchRewards,
  });
}

export function useUpdateReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Reward>;
    }) => {
      console.log("useUpdateReward - Updating reward:", id, "with data:", data);
      
      const response = await fetch(`/api/rewards/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("useUpdateReward - Error response:", error);
        throw new Error(error.error || "Failed to update reward");
      }

      const result = await response.json();
      console.log("useUpdateReward - Success response:", result);
      // API returns { success: true, reward: {...} }
      return result.reward as Reward;
    },
    onMutate: async ({ id, data }) => {
      console.log("useUpdateReward onMutate - Optimistic update:", { id, data });
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: REWARDS_TAG });

      // Snapshot the previous value for rollback
      const previousRewards = queryClient.getQueryData<Reward[]>(REWARDS_TAG);

      // Optimistically update to the new value immediately
      queryClient.setQueryData<Reward[]>(REWARDS_TAG, (old) => {
        if (!old) return old;
        const updated = old.map((reward) =>
          reward.id === id ? { ...reward, ...data } : reward
        );
        console.log("useUpdateReward onMutate - Optimistic update result:", updated);
        return updated;
      });

      // Return a context object with the snapshotted value
      return { previousRewards };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousRewards) {
        queryClient.setQueryData(REWARDS_TAG, context.previousRewards);
      }
    },
    onSuccess: (updatedReward) => {
      console.log("useUpdateReward onSuccess - Server response:", updatedReward);
      // Update the cache with the server response to ensure accuracy
      queryClient.setQueryData<Reward[]>(REWARDS_TAG, (old) => {
        if (!old) return old;
        const updated = old.map((reward) =>
          reward.id === updatedReward.id ? updatedReward : reward
        );
        console.log("useUpdateReward onSuccess - Updated cache:", updated);
        return updated;
      });
      // Also invalidate to trigger a refetch and ensure consistency
      queryClient.invalidateQueries({ queryKey: REWARDS_TAG });
    },
  });
}

export function useCreateReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reward: Omit<Reward, "id" | "winners">) => {
      const response = await fetch("/api/rewards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: reward.name,
          image: reward.image,
          totalQuantity: reward.totalQuantity,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create reward");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch rewards using the tag
      queryClient.invalidateQueries({ queryKey: REWARDS_TAG });
    },
  });
}

export function useDeleteReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/rewards/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete reward");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch rewards using the tag
      queryClient.invalidateQueries({ queryKey: REWARDS_TAG });
    },
  });
}

