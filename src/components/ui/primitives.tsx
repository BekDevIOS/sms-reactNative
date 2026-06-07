import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import {colors, font, radius, spacing} from '../../theme';
import {pillColors, PillTone} from '../../lib/labels';

// ---- Card ----

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// ---- Button ----

type ButtonVariant = 'primary' | 'danger' | 'ghost' | 'outline';

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      style={[
        styles.btn,
        variant === 'primary' && styles.btnPrimary,
        variant === 'danger' && styles.btnDanger,
        variant === 'outline' && styles.btnOutline,
        variant === 'ghost' && styles.btnGhost,
        isDisabled && styles.btnDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}>
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' || variant === 'outline' ? colors.primary : '#fff'} />
      ) : (
        <Text
          style={[
            styles.btnText,
            (variant === 'ghost' || variant === 'outline') && styles.btnTextAccent,
          ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ---- StatusPill ----

export function StatusPill({label, tone}: {label: string; tone: PillTone}) {
  const c = pillColors[tone];
  return (
    <View style={[styles.pill, {backgroundColor: c.bg}]}>
      <Text style={[styles.pillText, {color: c.text}]}>{label}</Text>
    </View>
  );
}

// ---- Section title ----

export function SectionTitle({children}: {children: React.ReactNode}) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

// ---- Key/value row ----

export function KeyValueRow({
  label,
  value,
  tint,
}: {
  label: string;
  value: React.ReactNode;
  tint?: string;
}) {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvLabel}>{label}</Text>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Text style={[styles.kvValue, tint ? {color: tint} : null]} numberOfLines={2}>
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
}

// ---- Loading / Empty / Error states ----

export function LoadingState({label}: {label?: string}) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} size="large" />
      {label ? <Text style={styles.stateText}>{label}</Text> : null}
    </View>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.center}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {hint ? <Text style={styles.stateText}>{hint}</Text> : null}
      {action ? <View style={{marginTop: spacing.lg}}>{action}</View> : null}
    </View>
  );
}

export function ErrorState({message, onRetry}: {message: string; onRetry?: () => void}) {
  return (
    <View style={styles.center}>
      <Text style={[styles.emptyTitle, {color: colors.danger}]}>Xatolik</Text>
      <Text style={styles.stateText}>{message}</Text>
      {onRetry ? (
        <View style={{marginTop: spacing.lg}}>
          <Button title="Qayta urinish" variant="outline" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btn: {
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {backgroundColor: colors.primary},
  btnDanger: {backgroundColor: colors.danger},
  btnOutline: {borderWidth: 1, borderColor: colors.primary},
  btnGhost: {backgroundColor: 'transparent'},
  btnDisabled: {opacity: 0.5},
  btnText: {color: '#fff', fontSize: font.md, fontWeight: '700'},
  btnTextAccent: {color: colors.primary},
  pill: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start'},
  pillText: {fontSize: font.xs, fontWeight: '700'},
  sectionTitle: {
    color: colors.muted,
    fontSize: font.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 7,
    gap: spacing.md,
  },
  kvLabel: {color: colors.muted, fontSize: font.sm},
  kvValue: {color: colors.text, fontSize: font.sm, fontWeight: '600', flexShrink: 1, textAlign: 'right'},
  center: {alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, paddingTop: 48},
  stateText: {color: colors.muted, fontSize: font.sm, marginTop: spacing.sm, textAlign: 'center'},
  emptyTitle: {color: colors.text, fontSize: font.lg, fontWeight: '700', textAlign: 'center'},
});
