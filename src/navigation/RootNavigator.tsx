import React from 'react';
import {NavigationContainer, DefaultTheme, Theme} from '@react-navigation/native';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {useAppState} from '../state/AppState';
import {ApiProvider} from '../api/queryClient';
import {AuthStack} from './AuthStack';
import {RootDrawer} from './RootDrawer';
import {colors} from '../theme';

const navTheme: Theme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.card,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

export function RootNavigator() {
  const {ready, member} = useAppState();

  if (!ready) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {member ? (
        <ApiProvider>
          <RootDrawer />
        </ApiProvider>
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center'},
});
