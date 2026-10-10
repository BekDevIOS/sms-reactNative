import React from 'react';
import {DrawerContentScrollView, DrawerContentComponentProps} from '@react-navigation/drawer';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useAppState} from '../state/AppState';
import {Icon} from '../components/icons/UiIcons';
import {NAV_SECTIONS} from './navConfig';
import {colors, font, spacing} from '../theme';

export function DrawerContent(props: DrawerContentComponentProps) {
  const {member, config, logout} = useAppState();
  const activeRoute = props.state.routeNames[props.state.index];

  return (
    <View style={styles.flex}>
      <LinearGradient
        colors={[colors.drawerHeader, colors.drawerHeaderTo]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>SMS</Text>
        </View>
        <Text style={styles.device}>{config?.deviceName ?? 'TezkorSMS'}</Text>
        {member?.memberPhone ? <Text style={styles.sub}>{member.memberPhone}</Text> : null}
        <Text style={styles.sub}>{member?.memberEmail}</Text>
      </LinearGradient>

      <DrawerContentScrollView {...props} contentContainerStyle={styles.scroll}>
        {NAV_SECTIONS.map((section, si) => {
          return (
            <View key={si} style={styles.section}>
              {section.title ? <Text style={styles.sectionTitle}>{section.title}</Text> : null}
              {section.items.map(item => {
                const active = activeRoute === item.route;
                return (
                  <TouchableOpacity
                    key={item.route}
                    style={[styles.item, active && styles.itemActive]}
                    disabled={item.disabled}
                    onPress={() => props.navigation.navigate(item.route as never)}>
                    <Icon
                      name={item.icon}
                      color={active ? colors.primary : item.disabled ? colors.border : colors.muted}
                    />
                    <Text
                      style={[
                        styles.itemLabel,
                        active && styles.itemLabelActive,
                        item.disabled && styles.itemLabelDisabled,
                      ]}>
                      {item.label}
                    </Text>
                    {item.disabled ? <Text style={styles.soon}>tez orada</Text> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </DrawerContentScrollView>

      <TouchableOpacity style={styles.logout} onPress={logout}>
        <Icon name="logout" color={colors.danger} />
        <Text style={styles.logoutText}>Chiqish</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: colors.bg},
  header: {paddingTop: 48, paddingBottom: spacing.xl, paddingHorizontal: spacing.xl},
  logo: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoText: {color: colors.drawerHeader, fontSize: 20, fontWeight: '900'},
  device: {color: '#fff', fontSize: font.lg, fontWeight: '800'},
  sub: {color: 'rgba(255,255,255,0.9)', fontSize: font.sm, marginTop: 2},
  scroll: {paddingTop: 0},
  section: {marginTop: spacing.md},
  sectionTitle: {
    color: colors.muted,
    fontSize: font.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    borderRadius: 10,
    marginHorizontal: spacing.sm,
  },
  itemActive: {backgroundColor: 'rgba(59,130,246,0.12)'},
  itemLabel: {color: colors.text, fontSize: font.md, flex: 1},
  itemLabelActive: {color: colors.primary, fontWeight: '700'},
  itemLabelDisabled: {color: colors.muted},
  soon: {color: colors.muted, fontSize: font.xs},
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  logoutText: {color: colors.danger, fontSize: font.md, fontWeight: '700'},
});
