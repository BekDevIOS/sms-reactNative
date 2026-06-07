/**
 * SMSAPP.UZ — Android app.
 * @format
 */

import React from 'react';
import {StatusBar} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AppStateProvider} from './src/state/AppState';
import {ErrorBoundary} from './src/components/ErrorBoundary';
import {RootNavigator} from './src/navigation/RootNavigator';
import {colors} from './src/theme';

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{flex: 1}}>
        <SafeAreaProvider>
          <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
          <AppStateProvider>
            <RootNavigator />
          </AppStateProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
