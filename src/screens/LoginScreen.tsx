import React, {useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {InvalidCredentialsError} from '../api/client';
import {useAppState} from '../state/AppState';
import {colors} from '../theme';

export default function LoginScreen() {
  const {baseUrl, setBaseUrl, login} = useAppState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [editServer, setEditServer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onLogin = async () => {
    setError(null);
    const e = email.trim();
    if (!e || !password) {
      setError('Enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(e, password);
    } catch (err) {
      if (err instanceof InvalidCredentialsError) {
        setError('Wrong email or password.');
      } else {
        setError('Could not reach the server. Check the address and your network.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>SMS Sender</Text>
        <Text style={styles.subtitle}>Sign in with your account.</Text>

        <View style={styles.serverRow}>
          <Text style={styles.serverLabel}>Server</Text>
          <TouchableOpacity onPress={() => setEditServer(v => !v)}>
            <Text style={styles.serverToggle}>{editServer ? 'Done' : 'Change'}</Text>
          </TouchableOpacity>
        </View>
        {editServer ? (
          <TextInput
            style={styles.input}
            value={baseUrl}
            onChangeText={setBaseUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder="http://192.168.1.10:4008"
            placeholderTextColor={colors.muted}
          />
        ) : (
          <Text style={styles.serverValue}>{baseUrl}</Text>
        )}

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor={colors.muted}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor={colors.muted}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={onLogin}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign in</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>
          Use the email and password of your account on the campaign backend. After signing in
          you can pick or create a sender device (subject to your device limit).
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: colors.bg},
  container: {padding: 24, paddingTop: 64},
  title: {fontSize: 30, fontWeight: '700', color: colors.text},
  subtitle: {fontSize: 15, color: colors.muted, marginTop: 6, marginBottom: 20},
  serverRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 6,
  },
  serverLabel: {fontSize: 13, color: colors.muted},
  serverToggle: {fontSize: 13, color: colors.primary, fontWeight: '600'},
  serverValue: {fontSize: 14, color: colors.text},
  label: {fontSize: 13, color: colors.muted, marginBottom: 6, marginTop: 16},
  input: {
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  error: {color: colors.danger, marginTop: 16},
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  buttonDisabled: {opacity: 0.6},
  buttonText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  hint: {color: colors.muted, fontSize: 12, marginTop: 24, lineHeight: 18},
});
