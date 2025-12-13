/**
 * Player Detail Screen
 *
 * View and manage individual player profile and games.
 */

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  FlatList,
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlayer, useGames, usePlayerStats, useDeleteGame } from '../../src/hooks';
import { POSITION_LABELS, LEAGUE_LABELS } from '../../src/types';
import type { Game } from '../../src/types';

function GameCard({ game, onDelete }: { game: Game; onDelete: () => void }) {
  const handleLongPress = () => {
    Alert.alert('Delete Game', 'Are you sure you want to delete this game?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <TouchableOpacity
      style={styles.gameCard}
      onLongPress={handleLongPress}
    >
      <View style={styles.gameHeader}>
        <Text style={styles.gameOpponent}>vs {game.opponent}</Text>
        <View
          style={[
            styles.gameResultBadge,
            game.result === 'Win' && styles.gameResultWin,
            game.result === 'Loss' && styles.gameResultLoss,
            game.result === 'Draw' && styles.gameResultDraw,
          ]}
        >
          <Text style={styles.gameResultText}>{game.result}</Text>
        </View>
      </View>
      <View style={styles.gameDetails}>
        <Text style={styles.gameDate}>
          {game.date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
        <Text style={styles.gameScore}>{game.finalScore}</Text>
      </View>
      <View style={styles.gameStats}>
        <View style={styles.gameStat}>
          <Text style={styles.gameStatValue}>{game.goals}</Text>
          <Text style={styles.gameStatLabel}>Goals</Text>
        </View>
        <View style={styles.gameStat}>
          <Text style={styles.gameStatValue}>{game.assists}</Text>
          <Text style={styles.gameStatLabel}>Assists</Text>
        </View>
        <View style={styles.gameStat}>
          <Text style={styles.gameStatValue}>{game.minutesPlayed}</Text>
          <Text style={styles.gameStatLabel}>Minutes</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function PlayerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: player, isLoading: playerLoading, refetch: refetchPlayer } = usePlayer(id);
  const { data: games, isLoading: gamesLoading, refetch: refetchGames } = useGames(id);
  const { stats } = usePlayerStats(id);
  const deleteGame = useDeleteGame();

  const isLoading = playerLoading || gamesLoading;
  const isRefetching = false;

  const handleRefresh = () => {
    refetchPlayer();
    refetchGames();
  };

  const handleDeleteGame = async (gameId: string) => {
    try {
      await deleteGame.mutateAsync({ playerId: id, gameId });
    } catch (error) {
      console.error('Failed to delete game:', error);
      Alert.alert('Error', 'Failed to delete game. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!player) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.error}>
          <Text style={styles.errorText}>Player not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const winRate = stats && stats.totalGames > 0
    ? Math.round((stats.wins / stats.totalGames) * 100)
    : 0;

  return (
    <>
      <Stack.Screen options={{ title: player.name }} />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
          }
        >
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitial}>
                {player.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.profileName}>{player.name}</Text>
            <Text style={styles.profilePosition}>
              {POSITION_LABELS[player.primaryPosition]}
            </Text>
            <Text style={styles.profileTeam}>{player.teamClub}</Text>
            <Text style={styles.profileLeague}>
              {LEAGUE_LABELS[player.leagueCode] || player.leagueCode}
            </Text>
          </View>

          {/* Quick Stats */}
          {stats && stats.totalGames > 0 && (
            <View style={styles.quickStats}>
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{stats.totalGames}</Text>
                <Text style={styles.quickStatLabel}>Games</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{stats.goals}</Text>
                <Text style={styles.quickStatLabel}>Goals</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{stats.assists}</Text>
                <Text style={styles.quickStatLabel}>Assists</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{winRate}%</Text>
                <Text style={styles.quickStatLabel}>Win Rate</Text>
              </View>
            </View>
          )}

          {/* Games Section */}
          <View style={styles.gamesSection}>
            <View style={styles.gamesSectionHeader}>
              <Text style={styles.gamesSectionTitle}>Games</Text>
              <TouchableOpacity
                style={styles.addGameButton}
                onPress={() => router.push(`/game/new?playerId=${id}`)}
              >
                <Text style={styles.addGameButtonText}>+ Log Game</Text>
              </TouchableOpacity>
            </View>

            {games && games.length > 0 ? (
              <View style={styles.gamesList}>
                {games.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    onDelete={() => handleDeleteGame(game.id)}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.noGames}>
                <Text style={styles.noGamesIcon}>📊</Text>
                <Text style={styles.noGamesText}>No games logged yet</Text>
                <Text style={styles.noGamesSubtext}>
                  Log a game to start tracking stats
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  backLink: {
    fontSize: 16,
    color: '#1e40af',
    fontWeight: '500',
  },
  profileHeader: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  profileAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInitial: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  profilePosition: {
    fontSize: 16,
    color: '#1e40af',
    fontWeight: '600',
    marginBottom: 4,
  },
  profileTeam: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  profileLeague: {
    fontSize: 12,
    color: '#6b7280',
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 2,
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  gamesSection: {
    padding: 16,
  },
  gamesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  gamesSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  addGameButton: {
    backgroundColor: '#1e40af',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  addGameButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  gamesList: {
    gap: 12,
  },
  gameCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gameOpponent: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  gameResultBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  gameResultWin: {
    backgroundColor: '#dcfce7',
  },
  gameResultLoss: {
    backgroundColor: '#fee2e2',
  },
  gameResultDraw: {
    backgroundColor: '#fef3c7',
  },
  gameResultText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  gameDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gameDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  gameScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  gameStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  gameStat: {
    flex: 1,
    alignItems: 'center',
  },
  gameStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  gameStatLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  noGames: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  noGamesIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noGamesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  noGamesSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
});
