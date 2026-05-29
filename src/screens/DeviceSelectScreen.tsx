import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {ApiClient, DeviceLimitError} from '../api/client';
import {DeviceSummary} from '../api/types';
import {useAppState} from '../state/AppState';
import {colors} from '../theme';

export default function DeviceSelectScreen() {
  const {member, selectDevice, createDevice, logout} = useAppState();
  const [devices, setDevices] = useState<DeviceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newName, setNewName] = useState('');

  const refresh = useCallback(async () => {
    if (!member) {
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await new ApiClient(member.baseUrl, member.memberToken).listDevices();
      setDevices(res.list);
    } catch {
      setError('Could not load your devices. Pull to retry.');
    } finally {
      setLoading(false);
    }
  }, [member]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onUse = async (d: DeviceSummary) => {
    setBusy(true);
    try {
      await selectDevice(d.code);
    } catch {
      Alert.alert('Error', 'Could not connect this device. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const onCreate = async () => {
    const name = newName.trim();
    if (!name) {
      Alert.alert('Name required', 'Give the new device a name (e.g. "Pixel-1").');
      return;
    }
    setBusy(true);
    try {
      await createDevice(name);
      // On success, AppState sets the active device → app moves to the dashboard.
    } catch (e) {
      if (e instanceof DeviceLimitError) {
        Alert.alert('Device limit reached', e.message || 'You have reached your device limit.');
      } else {
        Alert.alert('Error', 'Could not create the device. Try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Choose a device</Text>
          <Text style={styles.sub}>{member?.memberEmail}</Text>
        </View>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={devices}
        keyExtractor={d => d._id}
        onRefresh={refresh}
        refreshing={loading}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.createCard}>
            <Text style={styles.createTitle}>Create a new device</Text>
            <View style={styles.createRow}>
              <TextInput
                style={styles.input}
                value={newName}
                onChangeText={setNewName}
                placeholder="Device name (e.g. Pixel-1)"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.createBtn, busy && styles.dim]}
                onPress={onCreate}
                disabled={busy}>
                <Text style={styles.createBtnText}>Create</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.note}>Subject to your account's device limit.</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {devices.length > 0 ? <Text style={styles.listLabel}>Your devices</Text> : null}
          </View>
        }
        ListEmptyComponent={
          loading ? null : <Text style={styles.empty}>No devices yet. Create one above.</Text>
        }
        renderItem={({item}) => (
          <TouchableOpacity
            style={[styles.deviceRow, busy && styles.dim]}
            onPress={() => onUse(item)}
            disabled={busy}>
            <View style={styles.headerLeft}>
              <Text style={styles.deviceName}>{item.name}</Text>
              <Text style={styles.deviceMeta}>
                {item.status} · {item.sendLimitPerMinute}/min
              </Text>
            </View>
            <Text style={styles.use}>Use ›</Text>
          </TouchableOpacity>
        )}
      />

      {busy ? (
        <View style={styles.overlay}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: colors.bg},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerLeft: {flex: 1},
  title: {fontSize: 22, fontWeight: '700', color: colors.text},
  sub: {fontSize: 13, color: colors.muted, marginTop: 2},
  logout: {color: colors.danger, fontSize: 15, fontWeight: '600'},
  listContent: {paddingHorizontal: 20, paddingBottom: 40},
  createCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  createTitle: {color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 10},
  createRow: {flexDirection: 'row', gap: 10},
  input: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  createBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  createBtnText: {color: '#fff', fontWeight: '600'},
  note: {color: colors.muted, fontSize: 12, marginTop: 10},
  error: {color: colors.danger, fontSize: 13, marginTop: 10},
  listLabel: {color: colors.muted, fontSize: 13, marginTop: 16},
  empty: {color: colors.muted, fontSize: 15, textAlign: 'center', marginTop: 24},
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deviceName: {color: colors.text, fontSize: 16, fontWeight: '600'},
  deviceMeta: {color: colors.muted, fontSize: 12, marginTop: 2},
  use: {color: colors.primary, fontSize: 15, fontWeight: '600'},
  dim: {opacity: 0.5},
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});
