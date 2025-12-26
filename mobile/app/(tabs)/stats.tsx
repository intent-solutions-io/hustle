/**
 * Stats Screen
 *
 * Player statistics and performance analytics.
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlayers, usePlayerStats } from '../../src/hooks';
import { POSITION_LABELS } from '../../src/types';
import type { Player } from '../../src/types';

function StatCard({
  label,
  value,
  subValue,
}: {
  label: string;
  value: string | number;
  subValue?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {subValue && <Text style={styles.statSubValue}>{subValue}</Text>}
    </View>
  );
}

function PlayerStatsView({ player }: { player: Player }) {
  const { stats, games, isLoading } = usePlayerStats(player.id);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading stats...</Text>
      </View>
    );
  }

  if (!stats || stats.totalGames === 0) {
    return (
      <View style={styles.noStatsContainer}>
        <Text style={styles.noStatsIcon}>📊</Text>
        <Text style={styles.noStatsText}>No games logged yet</Text>
        <Text style={styles.noStatsSubtext}>
          Log a game to see {player.name}'s stats
        </Text>
      </View>
    );
  }

  const winRate = stats.totalGames > 0
    ? Math.round((stats.wins / stats.totalGames) * 100)
    : 0;

  return (
    <View style={styles.statsContainer}>
      {/* Player Header */}
      <View style={styles.playerHeader}>
        <View style={styles.playerAvatar}>
          <Text style={styles.playerInitial}>
            {player.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.playerName}>{player.name}</Text>
          <Text style={styles.playerPosition}>
            {POSITION_LABELS[player.primaryPosition]} • {player.teamClub}
          </Text>
        </View>
      </View>

      {/* Overview Stats */}
      <View style={styles.statsGrid}>
        <StatCard label="Games" value={stats.totalGames} />
        <StatCard label="Win Rate" value={`${winRate}%`} />
        <StatCard label="Goals" value={stats.goals} subValue={`${stats.goalsPerGame.toFixed(1)}/game`} />
        <StatCard label="Assists" value={stats.assists} subValue={`${stats.assistsPerGame.toFixed(1)}/game`} />
      </View>

      {/* Record */}
      <View style={styles.recordSection}>
        <Text style={styles.sectionTitle}>Season Record</Text>
        <View style={styles.recordRow}>
          <View style={styles.recordItem}>
            <Text style={styles.recordValue}>{stats.wins}</Text>
            <Text style={styles.recordLabel}>Wins</Text>
          </View>
          <View style={styles.recordDivider} />
          <View style={styles.recordItem}>
            <Text style={styles.recordValue}>{stats.draws}</Text>
            <Text style={styles.recordLabel}>Draws</Text>
          </View>
          <View style={styles.recordDivider} />
          <View style={styles.recordItem}>
            <Text style={styles.recordValue}>{stats.losses}</Text>
            <Text style={styles.recordLabel}>Losses</Text>
          </View>
        </View>
      </View>

      {/* Minutes */}
      <View style={styles.minutesSection}>
        <Text style={styles.sectionTitle}>Playing Time</Text>
        <View style={styles.minutesRow}>
          <Text style={styles.minutesValue}>{stats.minutesPlayed}</Text>
          <Text style={styles.minutesLabel}>total minutes</Text>
        </View>
        <Text style={styles.minutesAvg}>
          {stats.totalGames > 0
            ? `${Math.round(stats.minutesPlayed / stats.totalGames)} minutes per game`
            : 'No games yet'}
        </Text>
      </View>

      {/* Recent Games Preview */}
      {games && games.length > 0 && (
        <View style={styles.recentGames}>
          <Text style={styles.sectionTitle}>Recent Games</Text>
          {games.slice(0, 3).map((game) => (
            <View key={game.id} style={styles.gameRow}>
              <View style={styles.gameInfo}>
                <Text style={styles.gameOpponent}>vs {game.opponent}</Text>
                <Text style={styles.gameDate}>
                  {game.date.toLocaleDateString()}
                </Text>
              </View>
              <View
                style={[
                  styles.gameResult,
                  game.result === 'Win' && styles.gameResultWin,
                  game.result === 'Loss' && styles.gameResultLoss,
                  game.result === 'Draw' && styles.gameResultDraw,
                ]}
              >
                <Text style={styles.gameResultText}>{game.result}</Text>
              </View>
              <Text style={styles.gameScore}>{game.finalScore}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function StatsScreen() {
  const { data: players, isLoading, refetch, isRefetching } = usePlayers();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const selectedPlayer =
    selectedPlayerId && players
      ? players.find((p) => p.id === selectedPlayerId)
      : players?.[0] || null;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {/* Player Selector */}
        {players && players.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.playerSelector}
            contentContainerStyle={styles.playerSelectorContent}
          >
            {players.map((player) => (
              <TouchableOpacity
                key={player.id}
                style={[
                  styles.playerTab,
                  selectedPlayer?.id === player.id && styles.playerTabSelected,
                ]}
                onPress={() => setSelectedPlayerId(player.id)}
              >
                <Text
                  style={[
                    styles.playerTabText,
                    selectedPlayer?.id === player.id &&
                      styles.playerTabTextSelected,
                  ]}
                >
                  {player.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Stats View */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : selectedPlayer ? (
          <PlayerStatsView player={selectedPlayer} />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>No Players</Text>
            <Text style={styles.emptyMessage}>
              Add a player to view their statistics
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
  playerSelector: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  playerSelectorContent: {
    padding: 12,
    gap: 8,
  },
  playerTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  playerTabSelected: {
    backgroundColor: '#1e40af',
  },
  playerTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  playerTabTextSelected: {
    color: '#fff',
  },
  loadingContainer: {
    padding: 48,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  statsContainer: {
    padding: 16,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  playerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  playerName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  playerPosition: {
    fontSize: 14,
    color: '#6b7280',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statSubValue: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  recordSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordItem: {
    flex: 1,
    alignItems: 'center',
  },
  recordValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  recordLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  recordDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
  },
  minutesSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  minutesRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  minutesValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1e40af',
    marginRight: 8,
  },
  minutesLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  minutesAvg: {
    fontSize: 12,
    color: '#9ca3af',
  },
  recentGames: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  gameInfo: {
    flex: 1,
  },
  gameOpponent: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  gameDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  gameResult: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 12,
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
  },
  gameScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  noStatsContainer: {
    padding: 48,
    alignItems: 'center',
  },
  noStatsIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noStatsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  noStatsSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
