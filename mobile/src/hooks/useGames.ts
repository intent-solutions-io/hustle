/**
 * useGames Hook
 *
 * React Query hook for game data management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';
import {
  getGames,
  getGame,
  createGame,
  updateGame,
  deleteGame,
  calculatePlayerStats,
  type CreateGameData,
  type UpdateGameData,
} from '../lib/firebase';
import { playerKeys } from './usePlayers';

// Query keys
export const gameKeys = {
  all: ['games'] as const,
  lists: () => [...gameKeys.all, 'list'] as const,
  list: (userId: string, playerId: string) => [...gameKeys.lists(), userId, playerId] as const,
  details: () => [...gameKeys.all, 'detail'] as const,
  detail: (userId: string, playerId: string, gameId: string) =>
    [...gameKeys.details(), userId, playerId, gameId] as const,
  stats: (userId: string, playerId: string) => [...gameKeys.all, 'stats', userId, playerId] as const,
};

/**
 * Hook to get all games for a player
 */
export function useGames(playerId: string) {
  const { firebaseUser } = useAuthStore();
  const userId = firebaseUser?.uid;

  return useQuery({
    queryKey: gameKeys.list(userId || '', playerId),
    queryFn: () => {
      if (!userId) throw new Error('Not authenticated');
      return getGames(userId, playerId);
    },
    enabled: !!userId && !!playerId,
  });
}

/**
 * Hook to get a single game
 */
export function useGame(playerId: string, gameId: string) {
  const { firebaseUser } = useAuthStore();
  const userId = firebaseUser?.uid;

  return useQuery({
    queryKey: gameKeys.detail(userId || '', playerId, gameId),
    queryFn: () => {
      if (!userId) throw new Error('Not authenticated');
      return getGame(userId, playerId, gameId);
    },
    enabled: !!userId && !!playerId && !!gameId,
  });
}

/**
 * Hook to get player stats (calculated from games)
 */
export function usePlayerStats(playerId: string) {
  const { data: games, isLoading, error } = useGames(playerId);

  const stats = games ? calculatePlayerStats(games) : null;

  return {
    stats,
    isLoading,
    error,
    games,
  };
}

/**
 * Hook to create a new game
 */
export function useCreateGame() {
  const queryClient = useQueryClient();
  const { firebaseUser } = useAuthStore();
  const userId = firebaseUser?.uid;

  return useMutation({
    mutationFn: ({ playerId, data }: { playerId: string; data: CreateGameData }) => {
      if (!userId) throw new Error('Not authenticated');
      return createGame(userId, playerId, data);
    },
    onSuccess: (_, { playerId }) => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: gameKeys.list(userId, playerId) });
      }
    },
  });
}

/**
 * Hook to update a game
 */
export function useUpdateGame() {
  const queryClient = useQueryClient();
  const { firebaseUser } = useAuthStore();
  const userId = firebaseUser?.uid;

  return useMutation({
    mutationFn: ({
      playerId,
      gameId,
      data,
    }: {
      playerId: string;
      gameId: string;
      data: UpdateGameData;
    }) => {
      if (!userId) throw new Error('Not authenticated');
      return updateGame(userId, playerId, gameId, data);
    },
    onSuccess: (_, { playerId, gameId }) => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: gameKeys.list(userId, playerId) });
        queryClient.invalidateQueries({ queryKey: gameKeys.detail(userId, playerId, gameId) });
      }
    },
  });
}

/**
 * Hook to delete a game
 */
export function useDeleteGame() {
  const queryClient = useQueryClient();
  const { firebaseUser } = useAuthStore();
  const userId = firebaseUser?.uid;

  return useMutation({
    mutationFn: ({ playerId, gameId }: { playerId: string; gameId: string }) => {
      if (!userId) throw new Error('Not authenticated');
      return deleteGame(userId, playerId, gameId);
    },
    onSuccess: (_, { playerId }) => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: gameKeys.list(userId, playerId) });
      }
    },
  });
}
