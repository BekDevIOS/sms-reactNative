/**
 * SMS Sender — Android companion app.
 * @format
 */

import React, {useState} from 'react';
import {ActivityIndicator, StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AppStateProvider, useAppState} from './src/state/AppState';
import {ErrorBoundary} from './src/components/ErrorBoundary';
import LoginScreen from './src/screens/LoginScreen';
import DeviceSelectScreen from './src/screens/DeviceSelectScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import LogScreen from './src/screens/LogScreen';
import {colors} from './src/theme';

function Root() {
  const {ready, member, config} = useAppState();
  const [showLog, setShowLog] = useState(false);

  if (!ready) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }
  if (!member) {
    return <LoginScreen />;
  }
  if (!config) {
    return <DeviceSelectScreen />;
  }
  if (showLog) {
    return <LogScreen onBack={() => setShowLog(false)} />;
  }
  return <DashboardScreen onOpenLog={() => setShowLog(true)} />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
        <AppStateProvider>
          <Root />
        </AppStateProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
