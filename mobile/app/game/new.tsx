/**
 * New Game Screen
 *
 * Log game statistics for a player.
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePlayers, useCreateGame } from '../../src/hooks';
import type { Player, GameResult } from '../../src/types';

const gameSchema = z.object({
  playerId: z.string().min(1, 'Please select a player'),
  opponent: z.string().min(1, 'Opponent is required'),
  result: z.enum(['Win', 'Loss', 'Draw']),
  ourScore: z.string().regex(/^\d+$/, 'Must be a number'),
  theirScore: z.string().regex(/^\d+$/, 'Must be a number'),
  minutesPlayed: z.string().regex(/^\d+$/, 'Must be a number'),
  goals: z.string().regex(/^\d+$/, 'Must be a number'),
  assists: z.string().regex(/^\d+$/, 'Must be a number'),
});

type GameFormData = z.infer<typeof gameSchema>;

function PlayerSelector({
  players,
  selectedId,
  onSelect,
}: {
  players: Player[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
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
            styles.playerOption,
            selectedId === player.id && styles.playerOptionSelected,
          ]}
          onPress={() => onSelect(player.id)}
        >
          <View
            style={[
              styles.playerOptionAvatar,
              selectedId === player.id && styles.playerOptionAvatarSelected,
            ]}
          >
            <Text
              style={[
                styles.playerOptionInitial,
                selectedId === player.id && styles.playerOptionInitialSelected,
              ]}
            >
              {player.name.charAt(0)}
            </Text>
          </View>
          <Text
            style={[
              styles.playerOptionName,
              selectedId === player.id && styles.playerOptionNameSelected,
            ]}
            numberOfLines={1}
          >
            {player.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function ResultSelector({
  value,
  onChange,
}: {
  value: GameResult;
  onChange: (result: GameResult) => void;
}) {
  const results: GameResult[] = ['Win', 'Loss', 'Draw'];

  return (
    <View style={styles.resultSelector}>
      {results.map((result) => (
        <TouchableOpacity
          key={result}
          style={[
            styles.resultOption,
            value === result && styles.resultOptionSelected,
            value === result && result === 'Win' && styles.resultOptionWin,
            value === result && result === 'Loss' && styles.resultOptionLoss,
            value === result && result === 'Draw' && styles.resultOptionDraw,
          ]}
          onPress={() => onChange(result)}
        >
          <Text
            style={[
              styles.resultOptionText,
              value === result && styles.resultOptionTextSelected,
            ]}
          >
            {result}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function StatInput({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <View style={styles.statInputContainer}>
      <Text style={styles.statLabel}>{label}</Text>
      <TextInput
        style={[styles.statInput, error && styles.inputError]}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor="#9ca3af"
      />
    </View>
  );
}

export default function NewGameScreen() {
  const params = useLocalSearchParams<{ playerId?: string }>();
  const { data: players, isLoading: playersLoading } = usePlayers();
  const createGame = useCreateGame();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GameFormData>({
    resolver: zodResolver(gameSchema),
    defaultValues: {
      playerId: params.playerId || '',
      opponent: '',
      result: 'Win',
      ourScore: '0',
      theirScore: '0',
      minutesPlayed: '90',
      goals: '0',
      assists: '0',
    },
  });

  // Set initial player if none selected
  useEffect(() => {
    if (!params.playerId && players && players.length > 0) {
      setValue('playerId', players[0].id);
    }
  }, [players, params.playerId, setValue]);

  const selectedPlayerId = watch('playerId');

  const onSubmit = async (data: GameFormData) => {
    try {
      await createGame.mutateAsync({
        playerId: data.playerId,
        data: {
          date: new Date(),
          opponent: data.opponent,
          result: data.result,
          finalScore: `${data.ourScore}-${data.theirScore}`,
          minutesPlayed: parseInt(data.minutesPlayed, 10),
          goals: parseInt(data.goals, 10),
          assists: parseInt(data.assists, 10),
        },
      });
      router.back();
    } catch (error) {
      console.error('Failed to create game:', error);
      Alert.alert('Error', 'Failed to save game. Please try again.');
    }
  };

  if (playersLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#1e40af" />
        </View>
      </SafeAreaView>
    );
  }

  if (!players || players.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyTitle}>No Players</Text>
          <Text style={styles.emptyMessage}>
            Add a player before logging games
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.replace('/(tabs)/players')}
          >
            <Text style={styles.addButtonText}>Add Player</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollView}>
          {/* Player Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Player</Text>
            <Controller
              control={control}
              name="playerId"
              render={({ field: { value, onChange } }) => (
                <PlayerSelector
                  players={players}
                  selectedId={value}
                  onSelect={onChange}
                />
              )}
            />
          </View>

          {/* Opponent */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Opponent</Text>
            <Controller
              control={control}
              name="opponent"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  style={[styles.input, errors.opponent && styles.inputError]}
                  value={value}
                  onChangeText={onChange}
                  placeholder="e.g., FC United"
                  placeholderTextColor="#9ca3af"
                />
              )}
            />
            {errors.opponent && (
              <Text style={styles.errorText}>{errors.opponent.message}</Text>
            )}
          </View>

          {/* Result */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Result</Text>
            <Controller
              control={control}
              name="result"
              render={({ field: { value, onChange } }) => (
                <ResultSelector value={value} onChange={onChange} />
              )}
            />
          </View>

          {/* Score */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Final Score</Text>
            <View style={styles.scoreRow}>
              <Controller
                control={control}
                name="ourScore"
                render={({ field: { value, onChange } }) => (
                  <View style={styles.scoreInput}>
                    <Text style={styles.scoreLabel}>Us</Text>
                    <TextInput
                      style={styles.scoreValue}
                      value={value}
                      onChangeText={onChange}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  </View>
                )}
              />
              <Text style={styles.scoreDivider}>-</Text>
              <Controller
                control={control}
                name="theirScore"
                render={({ field: { value, onChange } }) => (
                  <View style={styles.scoreInput}>
                    <Text style={styles.scoreLabel}>Them</Text>
                    <TextInput
                      style={styles.scoreValue}
                      value={value}
                      onChangeText={onChange}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  </View>
                )}
              />
            </View>
          </View>

          {/* Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Player Stats</Text>
            <View style={styles.statsGrid}>
              <Controller
                control={control}
                name="minutesPlayed"
                render={({ field: { value, onChange } }) => (
                  <StatInput
                    label="Minutes"
                    value={value}
                    onChange={onChange}
                    error={errors.minutesPlayed?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="goals"
                render={({ field: { value, onChange } }) => (
                  <StatInput
                    label="Goals"
                    value={value}
                    onChange={onChange}
                    error={errors.goals?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="assists"
                render={({ field: { value, onChange } }) => (
                  <StatInput
                    label="Assists"
                    value={value}
                    onChange={onChange}
                    error={errors.assists?.message}
                  />
                )}
              />
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, createGame.isPending && styles.submitButtonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={createGame.isPending}
          >
            {createGame.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Save Game</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  playerSelector: {
    marginHorizontal: -16,
  },
  playerSelectorContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  playerOption: {
    alignItems: 'center',
    width: 80,
  },
  playerOptionSelected: {},
  playerOptionAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  playerOptionAvatarSelected: {
    backgroundColor: '#1e40af',
  },
  playerOptionInitial: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6b7280',
  },
  playerOptionInitialSelected: {
    color: '#fff',
  },
  playerOptionName: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  playerOptionNameSelected: {
    color: '#1e40af',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  resultSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  resultOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  resultOptionSelected: {
    borderWidth: 2,
  },
  resultOptionWin: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
  },
  resultOptionLoss: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  resultOptionDraw: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  resultOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  resultOptionTextSelected: {
    color: '#111827',
    fontWeight: '600',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  scoreInput: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  scoreValue: {
    width: 80,
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111827',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
  },
  scoreDivider: {
    fontSize: 32,
    fontWeight: '300',
    color: '#9ca3af',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statInputContainer: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  statInput: {
    width: '100%',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    color: '#111827',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    backgroundColor: '#1e40af',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#1e40af',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
