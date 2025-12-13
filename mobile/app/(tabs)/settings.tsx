/**
 * Settings Screen
 *
 * User account settings, preferences, and sign out.
 */

import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/hooks';

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  destructive,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.settingsRow}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={styles.settingsIcon}>{icon}</Text>
      <View style={styles.settingsContent}>
        <Text
          style={[styles.settingsLabel, destructive && styles.destructiveText]}
        >
          {label}
        </Text>
        {value && <Text style={styles.settingsValue}>{value}</Text>}
      </View>
      {onPress && <Text style={styles.settingsChevron}>›</Text>}
    </TouchableOpacity>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            console.error('Sign out error:', error);
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This will permanently delete all your data including all player profiles and game statistics. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'This is your final warning. All data will be permanently deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Permanently',
                  style: 'destructive',
                  onPress: () => {
                    // TODO: Implement account deletion
                    Alert.alert(
                      'Coming Soon',
                      'Account deletion will be available in a future update.'
                    );
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitial}>
              {user?.firstName?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.profileName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>

        {/* Account Section */}
        <SettingsSection title="Account">
          <SettingsRow
            icon="👤"
            label="Edit Profile"
            onPress={() => Alert.alert('Coming Soon')}
          />
          <SettingsRow
            icon="🔔"
            label="Notifications"
            onPress={() => Alert.alert('Coming Soon')}
          />
          <SettingsRow
            icon="🔒"
            label="Privacy"
            onPress={() => Alert.alert('Coming Soon')}
          />
        </SettingsSection>

        {/* Data Section */}
        <SettingsSection title="Data & Storage">
          <SettingsRow
            icon="📤"
            label="Export Data"
            onPress={() => Alert.alert('Coming Soon', 'Data export will be available in a future update.')}
          />
          <SettingsRow
            icon="☁️"
            label="Sync Status"
            value="Up to date"
          />
        </SettingsSection>

        {/* Support Section */}
        <SettingsSection title="Support">
          <SettingsRow
            icon="❓"
            label="Help Center"
            onPress={() => Alert.alert('Coming Soon')}
          />
          <SettingsRow
            icon="📧"
            label="Contact Support"
            onPress={() => Alert.alert('Contact', 'Email: support@hustlestats.io')}
          />
          <SettingsRow
            icon="📜"
            label="Terms of Service"
            onPress={() => Alert.alert('Coming Soon')}
          />
          <SettingsRow
            icon="🛡️"
            label="Privacy Policy"
            onPress={() => Alert.alert('Coming Soon')}
          />
        </SettingsSection>

        {/* Danger Zone */}
        <SettingsSection title="Danger Zone">
          <SettingsRow
            icon="🚪"
            label="Sign Out"
            onPress={handleSignOut}
          />
          <SettingsRow
            icon="🗑️"
            label="Delete Account"
            onPress={handleDeleteAccount}
            destructive
          />
        </SettingsSection>

        {/* Version Info */}
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>Hustle Stats v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2025 Intent Solutions IO</Text>
        </View>
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
  profileSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInitial: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingsIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingsContent: {
    flex: 1,
  },
  settingsLabel: {
    fontSize: 16,
    color: '#111827',
  },
  settingsValue: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  settingsChevron: {
    fontSize: 20,
    color: '#9ca3af',
  },
  destructiveText: {
    color: '#ef4444',
  },
  versionInfo: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  versionText: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
    color: '#d1d5db',
  },
});
