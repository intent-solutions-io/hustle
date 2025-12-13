/**
 * Players Screen
 *
 * List of all players with add/edit functionality.
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePlayers, useCreatePlayer, useDeletePlayer } from '../../src/hooks';
import {
  POSITION_LABELS,
  LEAGUE_LABELS,
  type Player,
  type SoccerPositionCode,
  type LeagueCode,
  type PlayerGender,
} from '../../src/types';

const createPlayerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  teamClub: z.string().min(1, 'Team/Club is required'),
  primaryPosition: z.string().min(1, 'Position is required'),
  leagueCode: z.string().min(1, 'League is required'),
  gender: z.enum(['male', 'female']),
});

type CreatePlayerFormData = z.infer<typeof createPlayerSchema>;

function PlayerCard({
  player,
  onPress,
  onDelete,
}: {
  player: Player;
  onPress: () => void;
  onDelete: () => void;
}) {
  const handleLongPress = () => {
    Alert.alert(
      'Delete Player',
      `Are you sure you want to delete ${player.name}? This will also delete all their game statistics.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={styles.playerCard}
      onPress={onPress}
      onLongPress={handleLongPress}
    >
      <View style={styles.playerAvatar}>
        <Text style={styles.playerInitial}>
          {player.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{player.name}</Text>
        <Text style={styles.playerDetails}>
          {POSITION_LABELS[player.primaryPosition]} • {player.teamClub}
        </Text>
        <Text style={styles.playerLeague}>
          {LEAGUE_LABELS[player.leagueCode] || player.leagueCode}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

function AddPlayerModal({
  visible,
  onClose,
  onSubmit,
  isLoading,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePlayerFormData) => void;
  isLoading: boolean;
}) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePlayerFormData>({
    resolver: zodResolver(createPlayerSchema),
    defaultValues: {
      name: '',
      teamClub: '',
      primaryPosition: 'CM',
      leagueCode: 'local_travel',
      gender: 'male',
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const positions: SoccerPositionCode[] = [
    'GK', 'CB', 'RB', 'LB', 'RWB', 'LWB',
    'DM', 'CM', 'AM', 'RW', 'LW', 'ST', 'CF',
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Player</Text>
            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              <Text
                style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
              >
                {isLoading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Player Name</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.input, errors.name && styles.inputError]}
                    placeholder="Jordan Smith"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name.message}</Text>
              )}
            </View>

            {/* Team/Club */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Team / Club</Text>
              <Controller
                control={control}
                name="teamClub"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.input, errors.teamClub && styles.inputError]}
                    placeholder="FC United Academy"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.teamClub && (
                <Text style={styles.errorText}>{errors.teamClub.message}</Text>
              )}
            </View>

            {/* Gender */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <Controller
                control={control}
                name="gender"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.genderRow}>
                    {(['male', 'female'] as PlayerGender[]).map((gender) => (
                      <TouchableOpacity
                        key={gender}
                        style={[
                          styles.genderOption,
                          value === gender && styles.genderOptionSelected,
                        ]}
                        onPress={() => onChange(gender)}
                      >
                        <Text
                          style={[
                            styles.genderOptionText,
                            value === gender && styles.genderOptionTextSelected,
                          ]}
                        >
                          {gender === 'male' ? 'Male' : 'Female'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />
            </View>

            {/* Position */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Primary Position</Text>
              <Controller
                control={control}
                name="primaryPosition"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.positionGrid}>
                    {positions.map((pos) => (
                      <TouchableOpacity
                        key={pos}
                        style={[
                          styles.positionOption,
                          value === pos && styles.positionOptionSelected,
                        ]}
                        onPress={() => onChange(pos)}
                      >
                        <Text
                          style={[
                            styles.positionCode,
                            value === pos && styles.positionCodeSelected,
                          ]}
                        >
                          {pos}
                        </Text>
                        <Text
                          style={[
                            styles.positionName,
                            value === pos && styles.positionNameSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {POSITION_LABELS[pos]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

export default function PlayersScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const { data: players, isLoading, refetch, isRefetching } = usePlayers();
  const createPlayer = useCreatePlayer();
  const deletePlayer = useDeletePlayer();

  const handleAddPlayer = async (data: CreatePlayerFormData) => {
    try {
      await createPlayer.mutateAsync({
        name: data.name,
        teamClub: data.teamClub,
        primaryPosition: data.primaryPosition as SoccerPositionCode,
        leagueCode: data.leagueCode as LeagueCode,
        gender: data.gender as PlayerGender,
        birthday: new Date(2010, 0, 1), // Default birthday (will be editable later)
      });
      setModalVisible(false);
    } catch (error) {
      console.error('Failed to create player:', error);
      Alert.alert('Error', 'Failed to create player. Please try again.');
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    try {
      await deletePlayer.mutateAsync(playerId);
    } catch (error) {
      console.error('Failed to delete player:', error);
      Alert.alert('Error', 'Failed to delete player. Please try again.');
    }
  };

  const renderPlayer = ({ item }: { item: Player }) => (
    <PlayerCard
      player={item}
      onPress={() => router.push(`/player/${item.id}`)}
      onDelete={() => handleDeletePlayer(item.id)}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <FlatList
        data={players}
        renderItem={renderPlayer}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>No Players</Text>
              <Text style={styles.emptyMessage}>
                Add your first player to start tracking stats
              </Text>
            </View>
          ) : null
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <AddPlayerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleAddPlayer}
        isLoading={createPlayer.isPending}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  playerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  playerDetails: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  playerLeague: {
    fontSize: 12,
    color: '#6b7280',
  },
  chevron: {
    fontSize: 24,
    color: '#9ca3af',
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabIcon: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  cancelButton: {
    fontSize: 16,
    color: '#6b7280',
  },
  saveButton: {
    fontSize: 16,
    color: '#1e40af',
    fontWeight: '600',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
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
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  genderOptionSelected: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  genderOptionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  genderOptionTextSelected: {
    color: '#fff',
  },
  positionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  positionOption: {
    width: '31%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  positionOptionSelected: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  positionCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 2,
  },
  positionCodeSelected: {
    color: '#fff',
  },
  positionName: {
    fontSize: 10,
    color: '#6b7280',
  },
  positionNameSelected: {
    color: '#dbeafe',
  },
});
