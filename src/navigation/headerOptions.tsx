import React from 'react';
import {DrawerActions, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationOptions} from '@react-navigation/native-stack';
import {StyleSheet, TouchableOpacity} from 'react-native';
import {Icon} from '../components/icons/UiIcons';

export const HEADER_BG = '#3949ab';

/** Hamburger button that opens the root drawer from inside a nested stack. */
export function HeaderMenuButton() {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      style={styles.btn}
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      hitSlop={12}>
      <Icon name="menu" color="#fff" size={24} />
    </TouchableOpacity>
  );
}

/** Common native-stack header styling (indigo bar, white text). */
export const stackHeader: NativeStackNavigationOptions = {
  headerStyle: {backgroundColor: HEADER_BG},
  headerTintColor: '#fff',
  headerTitleStyle: {fontWeight: '700'},
  headerShadowVisible: false,
};

/** Header options for a stack's root screen — adds the drawer hamburger. */
export const rootScreenHeader: NativeStackNavigationOptions = {
  ...stackHeader,
  headerLeft: () => <HeaderMenuButton />,
};

const styles = StyleSheet.create({
  btn: {paddingHorizontal: 4, paddingVertical: 4, marginRight: 8},
});
