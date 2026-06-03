import React, {Component, ErrorInfo, ReactNode} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {colors} from '../theme';

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/**
 * Catches render errors so a crash shows a recovery screen instead of a white
 * screen / hard crash. The worker (SMS sending) runs in a headless task and is
 * unaffected, but the UI should still degrade gracefully.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = {error: null};

  static getDerivedStateFromError(error: Error): State {
    return {error};
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('UI crash:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.wrap}>
          <Text style={styles.title}>Xatolik yuz berdi</Text>
          <Text style={styles.msg}>Ilovani qayta urinib ko'ring.</Text>
          <TouchableOpacity style={styles.btn} onPress={() => this.setState({error: null})}>
            <Text style={styles.btnText}>Qayta urinish</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: {flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24},
  title: {color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 8},
  msg: {color: colors.muted, marginBottom: 20, textAlign: 'center'},
  btn: {backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10},
  btnText: {color: '#fff', fontWeight: '600'},
});
