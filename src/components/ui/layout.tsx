import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import {colors, font, radius, spacing} from '../../theme';

/** Plain full-bleed screen background. Screens supply their own ScrollView/FlatList. */
export function Screen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

export function SearchInput({
  value,
  onChangeText,
  placeholder = 'Qidirish…',
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}) {
  return (
    <TextInput
      style={styles.search}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      autoCapitalize="none"
      autoCorrect={false}
    />
  );
}

/** A tappable list row: title, optional subtitle, optional trailing node. */
export function ListRow({
  title,
  subtitle,
  trailing,
  onPress,
  style,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const Wrapper: any = onPress ? TouchableOpacity : View;
  return (
    <Wrapper style={[styles.row, style]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowMain}>
        {typeof title === 'string' ? (
          <Text style={styles.rowTitle} numberOfLines={1}>
            {title}
          </Text>
        ) : (
          title
        )}
        {subtitle != null ? (
          typeof subtitle === 'string' ? (
            <Text style={styles.rowSubtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : (
            subtitle
          )
        ) : null}
      </View>
      {trailing ? <View style={styles.rowTrailing}>{trailing}</View> : null}
    </Wrapper>
  );
}

/** Floating "+" action button (bottom-right), distinct from the worker FAB. */
export function AddFab({onPress}: {onPress: () => void}) {
  return (
    <TouchableOpacity style={styles.addFab} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.addFabText}>＋</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.bg},
  search: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: font.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  rowMain: {flex: 1},
  rowTitle: {color: colors.text, fontSize: font.md, fontWeight: '600'},
  rowSubtitle: {color: colors.muted, fontSize: font.sm, marginTop: 2},
  rowTrailing: {alignItems: 'flex-end'},
  addFab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 3},
  },
  addFabText: {color: '#fff', fontSize: 30, fontWeight: '300', lineHeight: 34},
});
