import React from 'react';
import {StyleProp, StyleSheet, Text, ViewStyle} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {colors, font, radius, spacing} from '../../theme';

/** A blue-gradient stat tile (big value + label), matching the reference dashboard. */
export function StatCard({
  value,
  label,
  from = colors.gradientBlueFrom,
  to = colors.gradientBlueTo,
  style,
}: {
  value: number | string;
  label: string;
  from?: string;
  to?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <LinearGradient
      colors={[from, to]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={[styles.card, style]}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 96,
  },
  value: {color: colors.onAccent, fontSize: font.xxl, fontWeight: '800'},
  label: {color: colors.onAccent, fontSize: font.sm, marginTop: 4, opacity: 0.95, textAlign: 'center'},
});
