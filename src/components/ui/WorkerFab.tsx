import React from 'react';
import {ActivityIndicator, StyleSheet, Text, TouchableOpacity} from 'react-native';
import {colors, spacing} from '../../theme';

/**
 * The pink floating action button that toggles the SMS-sending worker.
 * Shows ▶ when stopped and ■ when running. Disabled (greyed) when no device
 * is configured; tapping then routes the user to device selection.
 */
export function WorkerFab({
  running,
  busy,
  disabled,
  onPress,
}: {
  running: boolean;
  busy?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.fab, disabled && styles.fabDisabled]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={busy}>
      {busy ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.icon}>{running ? '■' : '▶'}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.fab,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
  },
  fabDisabled: {backgroundColor: colors.muted, opacity: 0.7},
  icon: {color: '#fff', fontSize: 26, fontWeight: '800', marginLeft: 2},
});
