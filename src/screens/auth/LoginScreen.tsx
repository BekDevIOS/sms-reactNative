import React, {useState} from 'react';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import {useAppState} from '../../state/AppState';
import {errorMessage} from '../../lib/errors';
import {Button} from '../../components/ui/primitives';
import {colors, font, radius, spacing} from '../../theme';
import type {AuthStackParamList} from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({navigation}: Props) {
  const {login} = useAppState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onLogin = async () => {
    setError(null);
    const e = email.trim();
    if (!e || !password) {
      setError('Email va parolni kiriting.');
      return;
    }
    setLoading(true);
    try {
      await login(e, password);
    } catch (err) {
      setError(errorMessage(err, 'Serverga ulanib bolmadi. Internetni tekshiring.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>SMSAPP.UZ</Text>
        <Text style={styles.subtitle}>Hisobingiz bilan kiring.</Text>

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

        <Text style={styles.label}>Parol</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Password"
          placeholderTextColor={colors.muted}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button title="Kirish" onPress={onLogin} loading={loading} style={styles.button} />

        <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.linkText}>Hisobingiz yoqmi? Royxatdan oting</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: colors.bg},
  container: {padding: spacing.xxl, paddingTop: 64},
  title: {fontSize: 30, fontWeight: '800', color: colors.text},
  subtitle: {fontSize: font.md, color: colors.muted, marginTop: 6, marginBottom: spacing.xl},
  label: {fontSize: font.sm, color: colors.muted, marginBottom: 6, marginTop: spacing.lg},
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: font.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  error: {color: colors.danger, marginTop: spacing.lg},
  button: {marginTop: spacing.xxl},
  linkRow: {alignItems: 'center', paddingVertical: spacing.lg, marginTop: spacing.sm},
  linkText: {color: colors.primary, fontSize: font.sm, fontWeight: '600'},
});
