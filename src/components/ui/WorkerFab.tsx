import React from 'react';
import {ActivityIndicator, StyleSheet, Text, TouchableOpacity} from 'react-native';
import {colors, font, spacing} from '../../theme';

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
        <Text style={styles.icon}>{running ? 'STOP' : 'GO'}</Text>
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
  icon: {color: '#fff', fontSize: font.xs, fontWeight: '800', letterSpacing: 0.8},
});
