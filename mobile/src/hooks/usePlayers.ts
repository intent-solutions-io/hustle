/**
 * usePlayers Hook
 *
 * React Query hook for player data management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';
import {
  getPlayers,
  getPlayer,
  createPlayer,
  updatePlayer,
  deletePlayer,
  type CreatePlayerData,
  type UpdatePlayerData,
} from '../lib/firebase';

// Query keys
export const playerKeys = {
  all: ['players'] as const,
  lists: () => [...playerKeys.all, 'list'] as const,
  list: (userId: string) => [...playerKeys.lists(), userId] as const,
  details: () => [...playerKeys.all, 'detail'] as const,
  detail: (userId: string, playerId: string) => [...playerKeys.details(), userId, playerId] as const,
};

/**
 * Hook to get all players for the current user
 */
export function usePlayers() {
  const { firebaseUser } = useAuthStore();
  const userId = firebaseUser?.uid;

  return useQuery({
    queryKey: playerKeys.list(userId || ''),
    queryFn: () => {
      if (!userId) throw new Error('Not authenticated');
      return getPlayers(userId);
    },
    enabled: !!userId,
  });
}

/**
 * Hook to get a single player
 */
export function usePlayer(playerId: string) {
  const { firebaseUser } = useAuthStore();
  const userId = firebaseUser?.uid;

  return useQuery({
    queryKey: playerKeys.detail(userId || '', playerId),
    queryFn: () => {
      if (!userId) throw new Error('Not authenticated');
      return getPlayer(userId, playerId);
    },
    enabled: !!userId && !!playerId,
  });
}

/**
 * Hook to create a new player
 */
export function useCreatePlayer() {
  const queryClient = useQueryClient();
  const { firebaseUser } = useAuthStore();
  const userId = firebaseUser?.uid;

  return useMutation({
    mutationFn: (data: CreatePlayerData) => {
      if (!userId) throw new Error('Not authenticated');
      return createPlayer(userId, data);
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: playerKeys.list(userId) });
      }
    },
  });
}

/**
 * Hook to update a player
 */
export function useUpdatePlayer() {
  const queryClient = useQueryClient();
  const { firebaseUser } = useAuthStore();
  const userId = firebaseUser?.uid;

  return useMutation({
    mutationFn: ({ playerId, data }: { playerId: string; data: UpdatePlayerData }) => {
      if (!userId) throw new Error('Not authenticated');
      return updatePlayer(userId, playerId, data);
    },
    onSuccess: (_, { playerId }) => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: playerKeys.list(userId) });
        queryClient.invalidateQueries({ queryKey: playerKeys.detail(userId, playerId) });
      }
    },
  });
}

/**
 * Hook to delete a player
 */
export function useDeletePlayer() {
  const queryClient = useQueryClient();
  const { firebaseUser } = useAuthStore();
  const userId = firebaseUser?.uid;

  return useMutation({
    mutationFn: (playerId: string) => {
      if (!userId) throw new Error('Not authenticated');
      return deletePlayer(userId, playerId);
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: playerKeys.list(userId) });
      }
    },
  });
}
